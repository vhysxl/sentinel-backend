import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { UsersQuery } from '../db/queries/users.query.js';
import { comparePassword, hashPassword } from '../utils/password.util.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import { config } from '../config/env.config.js';



const googleClient = new OAuth2Client(config.googleClientId);

export class AuthService {
  /**
   * Login with Identifier (Email, Username, or NISN) + Password
   */
  static async login(identifier, password, role) {
    const user = await UsersQuery.findByIdentifier(identifier);
    console.log('[DEBUG Auth] Login attempt:', { identifier, role, userRole: user?.role });

    if (!user) {
      console.log('[DEBUG Auth] User not found for identifier:', identifier);
      const error = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    // Optional role check if role is explicitly provided in request
    if (role && user.role.toUpperCase() !== role.toUpperCase()) {
      console.log('[DEBUG Auth] Role mismatch. Expected:', role, 'Got:', user.role);
      const error = new Error('You are not authorized to login from this portal.');
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error(ERROR_MESSAGES.ACCOUNT_INACTIVE);
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    // Token Payload Claims
    const tokenPayload = {
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ sub: user.id });

    // Exclude passwordHash from returned user profile
    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      mustChangePassword: user.mustChangePassword,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Google OAuth Login / Authentication
   */
  static async googleLogin(idToken, role) {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      // Handle system clock skew (e.g. "Token used too early")
      if (err.message && err.message.includes('Token used too early')) {
        const decoded = jwt.decode(idToken);
        if (
          decoded &&
          (decoded.iss === 'https://accounts.google.com' || decoded.iss === 'accounts.google.com') &&
          decoded.aud === config.googleClientId
        ) {
          payload = decoded;
        } else {
          const error = new Error(ERROR_MESSAGES.INVALID_GOOGLE_TOKEN);
          error.statusCode = HTTP_STATUS.UNAUTHORIZED;
          throw error;
        }
      } else {
        const error = new Error(ERROR_MESSAGES.INVALID_GOOGLE_TOKEN);
        error.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw error;
      }
    }

    const { sub: googleId, email } = payload;

    // 1. Search by Google ID first
    let user = await UsersQuery.findByGoogleId(googleId);

    // 2. If not found by Google ID, search by Email in users table and auto-link
    if (!user && email) {
      user = await UsersQuery.findByEmail(email);
      if (user) {
        user = await UsersQuery.linkGoogleId(user.id, googleId);
      }
    }

    // 3. Reject if user account does not exist in users table (Must be pre-created by Admin / Dapodik sync)
    if (!user) {
      const error = new Error(ERROR_MESSAGES.GOOGLE_ACCOUNT_NOT_REGISTERED);
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    console.log('[DEBUG Auth] Google login attempt:', { email, role, userRole: user?.role });

    // Optional role check if role is explicitly provided
    if (role && user.role.toUpperCase() !== role.toUpperCase()) {
      console.log('[DEBUG Auth] Google login role mismatch. Expected:', role, 'Got:', user.role);
      const error = new Error('You are not authorized to login from this portal.');
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }



    // 4. Check if account is active
    if (!user.isActive) {
      const error = new Error(ERROR_MESSAGES.ACCOUNT_INACTIVE);
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    // 5. Generate Access & Refresh Tokens
    const tokenPayload = {
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ sub: user.id });

    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      mustChangePassword: user.mustChangePassword,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Forced/Voluntary Password Change
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const user = await UsersQuery.findById(userId);
    if (!user) {
      const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // If password change is NOT first-time forced, verify old password
    if (!user.mustChangePassword) {
      if (!oldPassword) {
        const error = new Error(ERROR_MESSAGES.OLD_PASSWORD_REQUIRED);
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      const isMatch = await comparePassword(oldPassword, user.passwordHash);
      if (!isMatch) {
        const error = new Error(ERROR_MESSAGES.INVALID_CURRENT_PASSWORD);
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
    }

    const newPasswordHash = await hashPassword(newPassword);
    const updatedUser = await UsersQuery.updatePassword(userId, newPasswordHash);

    const { passwordHash: _, ...safeUser } = updatedUser;
    return safeUser;
  }

  /**
   * Refresh Access Token using Refresh Token
   */
  static async refreshToken(refreshTokenStr) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshTokenStr);
    } catch (err) {
      const error = new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    const user = await UsersQuery.findById(decoded.sub);

    if (!user || !user.isActive) {
      const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    const tokenPayload = {
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    return { accessToken: newAccessToken };
  }

  /**
   * Get authenticated user profile
   */
  static async getMe(userId) {
    const user = await UsersQuery.findById(userId);
    if (!user) {
      const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

