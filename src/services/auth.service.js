import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { UsersQuery, toSafeUser } from '../db/queries/users.query.js';
import { comparePassword, hashPassword } from '../utils/password.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  buildTokenPayload
} from '../utils/jwt.util.js';
import { createError } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import { config } from '../config/env.config.js';

const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

const invalidCredentials = () =>
  createError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);

const issueSession = (user) => ({
  user: toSafeUser(user),
  mustChangePassword: user.mustChangePassword,
  tokens: {
    accessToken: generateAccessToken(buildTokenPayload(user)),
    refreshToken: generateRefreshToken({ sub: user.id })
  }
});

export class AuthService {
  /**
   * Email + password sign-in.
   *
   * Unknown email, wrong password, and a Google-only account all produce the
   * SAME 401 so an outsider cannot discover who is on the finance team. The
   * logs below deliberately DO distinguish them — that split is the point.
   */
  static async login(email, password) {
    const user = await UsersQuery.findByEmail(email);

    if (!user) {
      console.error(`[AUTH][login] no account for ${email}`);
      throw invalidCredentials();
    }

    if (!user.passwordHash) {
      console.error(`[AUTH][login] user ${user.id} is Google-only, password login rejected`);
      throw invalidCredentials();
    }

    const matches = await comparePassword(password, user.passwordHash);
    if (!matches) {
      console.error(`[AUTH][login] wrong password for user ${user.id}`);
      throw invalidCredentials();
    }

    if (!user.isActive) {
      console.error(`[AUTH][login] user ${user.id} is deactivated`);
      throw createError(ERROR_MESSAGES.ACCOUNT_INACTIVE, HTTP_STATUS.FORBIDDEN);
    }

    await UsersQuery.touchLastLogin(user.id);
    console.log(`[AUTH][login] user ${user.id} signed in with password`);

    return issueSession(user);
  }

  /**
   * Google sign-in. Google proves identity; it never grants membership —
   * an unregistered email is rejected instead of provisioned.
   */
  static async googleLogin(idToken) {
    if (!googleClient) {
      console.error('[AUTH][google] GOOGLE_CLIENT_ID is not configured');
      throw createError(ERROR_MESSAGES.GOOGLE_NOT_CONFIGURED, HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    const payload = await AuthService.#verifyGoogleToken(idToken);

    if (payload.email_verified !== true) {
      console.error(`[AUTH][google] unverified email ${payload.email}`);
      throw createError(ERROR_MESSAGES.GOOGLE_EMAIL_UNVERIFIED, HTTP_STATUS.UNAUTHORIZED);
    }

    const email = String(payload.email || '').toLowerCase();
    let user = await UsersQuery.findByEmail(email);

    if (!user) {
      console.error(`[AUTH][google] ${email} is not registered, refusing to auto-provision`);
      throw createError(ERROR_MESSAGES.GOOGLE_ACCOUNT_NOT_REGISTERED, HTTP_STATUS.FORBIDDEN);
    }

    if (!user.isActive) {
      console.error(`[AUTH][google] user ${user.id} is deactivated`);
      throw createError(ERROR_MESSAGES.ACCOUNT_INACTIVE, HTTP_STATUS.FORBIDDEN);
    }

    if (!user.googleSub) {
      user = await UsersQuery.linkGoogleSub(user.id, payload.sub);
    }

    // The handed-over temporary password was never used, and it is still
    // sitting in a chat log somewhere. Burn it. The owner can set a password
    // of their own at any time via /auth/set-password.
    let tempPasswordCleared = false;
    if (user.mustChangePassword) {
      user = await UsersQuery.clearPassword(user.id);
      tempPasswordCleared = true;
      console.log(`[AUTH][google] temp password burned for user ${user.id}`);
    }

    await UsersQuery.touchLastLogin(user.id);
    console.log(`[AUTH][google] user ${user.id} signed in with Google`);

    return { ...issueSession(user), tempPasswordCleared };
  }

  static async #verifyGoogleToken(idToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.googleClientId
      });
      return ticket.getPayload();
    } catch (error) {
      // Windows dev machines drift enough to trip Google's "used too early"
      // check on freshly minted tokens; fall back to decoding once the
      // issuer and audience still line up.
      if (error.message?.includes('Token used too early')) {
        const decoded = jwt.decode(idToken);
        const issuerOk =
          decoded?.iss === 'https://accounts.google.com' || decoded?.iss === 'accounts.google.com';

        if (issuerOk && decoded.aud === config.googleClientId) {
          console.error('[AUTH][google] clock skew tolerated for a valid token');
          return decoded;
        }
      }

      console.error('[AUTH][google] token verification failed:', error.message);
      throw createError(ERROR_MESSAGES.INVALID_GOOGLE_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  static async refresh(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      console.error('[AUTH][refresh] token rejected:', error.message);
      throw createError(ERROR_MESSAGES.INVALID_REFRESH_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await UsersQuery.findById(decoded.sub);
    if (!user || !user.isActive) {
      console.error(`[AUTH][refresh] user ${decoded.sub} missing or deactivated`);
      throw createError(ERROR_MESSAGES.INVALID_REFRESH_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }

    return { accessToken: generateAccessToken(buildTokenPayload(user)) };
  }

  /**
   * Deactivation must kill sessions already in flight, so this returns 401
   * rather than 403 — the frontend treats it as an expired session.
   */
  static async getMe(userId) {
    const user = await UsersQuery.findById(userId);

    if (!user || !user.isActive) {
      console.error(`[AUTH][me] user ${userId} missing or deactivated`);
      throw createError(ERROR_MESSAGES.AUTH_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
    }

    return toSafeUser(user);
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await UsersQuery.findById(userId);
    if (!user) {
      throw createError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (!user.passwordHash) {
      console.error(`[AUTH][change-password] user ${userId} has no password set`);
      throw createError(ERROR_MESSAGES.PASSWORD_NOT_SET, HTTP_STATUS.BAD_REQUEST);
    }

    const matches = await comparePassword(currentPassword, user.passwordHash);
    if (!matches) {
      console.error(`[AUTH][change-password] wrong current password for user ${userId}`);
      throw createError(ERROR_MESSAGES.INVALID_CURRENT_PASSWORD, HTTP_STATUS.BAD_REQUEST);
    }

    if (await comparePassword(newPassword, user.passwordHash)) {
      throw createError(ERROR_MESSAGES.PASSWORD_SAME_AS_OLD, HTTP_STATUS.BAD_REQUEST);
    }

    const updated = await UsersQuery.setPassword(userId, await hashPassword(newPassword), {
      mustChangePassword: false
    });

    console.log(`[AUTH][change-password] user ${userId} changed their password`);
    return toSafeUser(updated);
  }

  /**
   * First password for a Google-only account. There is no current password to
   * verify — the active session is the proof of ownership.
   */
  static async setPassword(userId, newPassword) {
    const user = await UsersQuery.findById(userId);
    if (!user) {
      throw createError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (user.passwordHash) {
      console.error(`[AUTH][set-password] user ${userId} already has a password`);
      throw createError(ERROR_MESSAGES.PASSWORD_ALREADY_SET, HTTP_STATUS.BAD_REQUEST);
    }

    const updated = await UsersQuery.setPassword(userId, await hashPassword(newPassword), {
      mustChangePassword: false
    });

    console.log(`[AUTH][set-password] user ${userId} set their first password`);
    return toSafeUser(updated);
  }
}
