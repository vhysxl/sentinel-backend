import { DashboardService } from '../services/dashboard.service.js';
import { successResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';

export class DashboardController {
  static getSummary = asyncHandler(async (req, res) => {
    const data = await DashboardService.getSummary(req.query);
    return successResponse(res, 'Dashboard data retrieved successfully', data);
  });
}
