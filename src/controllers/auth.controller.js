import { AuthService } from '../services/auth.service.js';
import { successResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';

export class AuthController {
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    return successResponse(res, 'Login successful', result);
  });

  static googleLogin = asyncHandler(async (req, res) => {
    const result = await AuthService.googleLogin(req.body.idToken);

    // Tells the UI to show the one-time notice explaining that the temporary
    // password no longer works.
    const message = result.tempPasswordCleared
      ? 'Signed in with Google. Your temporary password is no longer valid.'
      : 'Login successful';

    return successResponse(res, message, result);
  });

  static refresh = asyncHandler(async (req, res) => {
    const result = await AuthService.refresh(req.body.refreshToken);
    return successResponse(res, 'Access token refreshed', result);
  });

  static getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.user.sub);
    return successResponse(res, 'User retrieved successfully', { user });
  });

  static changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await AuthService.changePassword(req.user.sub, currentPassword, newPassword);
    return successResponse(res, 'Password updated successfully', { user });
  });

  static setPassword = asyncHandler(async (req, res) => {
    const user = await AuthService.setPassword(req.user.sub, req.body.newPassword);
    return successResponse(res, 'Password set successfully', { user });
  });
}
