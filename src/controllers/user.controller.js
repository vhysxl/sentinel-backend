import { UserService } from '../services/user.service.js';
import { successResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { HTTP_STATUS } from '../constants/index.js';

const TEMP_PASSWORD_NOTICE =
  'Copy this temporary password now — it cannot be retrieved later. Hand it to the member directly.';

export class UserController {
  static list = asyncHandler(async (req, res) => {
    const users = await UserService.list();
    return successResponse(res, 'Users retrieved successfully', { users });
  });

  static create = asyncHandler(async (req, res) => {
    const { email, fullname } = req.body;
    const { user, tempPassword } = await UserService.create({ email, fullname });

    return successResponse(
      res,
      'User created successfully',
      { user, tempPassword, notice: TEMP_PASSWORD_NOTICE },
      HTTP_STATUS.CREATED
    );
  });

  static resetPassword = asyncHandler(async (req, res) => {
    const { user, tempPassword } = await UserService.resetPassword(req.params.id);
    return successResponse(res, 'Temporary password issued', {
      user,
      tempPassword,
      notice: TEMP_PASSWORD_NOTICE
    });
  });

  static setStatus = asyncHandler(async (req, res) => {
    const user = await UserService.setStatus(req.user.sub, req.params.id, req.body.isActive);
    const message = req.body.isActive ? 'User activated' : 'User deactivated';
    return successResponse(res, message, { user });
  });
}
