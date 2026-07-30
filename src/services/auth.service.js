import { UsersQuery } from '../db/queries/users.query.js';
import { comparePassword, hashPassword } from '../utils/password.util.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

export class AuthService {
  /**
   * Login with Identifier (Email, Username, or NISN) + Password
   */
  static async login(identifier, password) {
    const user = await UsersQuery.findByIdentifier(identifier);

    if (!user) {
      const error = new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
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
    if (!user.mustChangePassword && oldPassword) {
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
    try {
      const decoded = verifyRefreshToken(refreshTokenStr);
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
    } catch (err) {
      const error = new Error(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }
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
