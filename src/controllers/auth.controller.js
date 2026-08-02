import { AuthService } from '../services/auth.service.js';
import { successResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { HTTP_STATUS } from '../constants/http-status.constant.js';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req, res) => {
    const { identifier, password, role } = req.body;
    const result = await AuthService.login(identifier, password, role);
    return successResponse(res, 'Login successful', result, HTTP_STATUS.OK);
  });

  /**
   * POST /api/v1/auth/change-password
   */
  static changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { oldPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(userId, oldPassword, newPassword);
    return successResponse(
      res,
      'Password successfully changed. You can now use your new password.',
      result,
      HTTP_STATUS.OK
    );
  });

  /**
   * POST /api/v1/auth/refresh
   */
  static refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    return successResponse(res, 'Access token refreshed successfully', result, HTTP_STATUS.OK);
  });

  /**
   * POST /api/v1/auth/google
   */
  static googleLogin = asyncHandler(async (req, res) => {
    const { idToken, role } = req.body;
    const result = await AuthService.googleLogin(idToken, role);
    return successResponse(res, 'Google authentication successful', result, HTTP_STATUS.OK);
  });

  /**
   * GET /api/v1/auth/me
   */
  static getMe = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const user = await AuthService.getMe(userId);
    return successResponse(res, 'Authenticated user profile retrieved', user, HTTP_STATUS.OK);
  });
}

