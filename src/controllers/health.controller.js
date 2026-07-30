import { HealthService } from '../services/health.service.js';
import { successResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { HTTP_STATUS } from '../constants/http-status.constant.js';

export class HealthController {
  /**
   * Controller Layer - Handles GET /health endpoint
   */
  static getHealth = asyncHandler(async (req, res) => {
    const healthData = await HealthService.getHealthStatus();
    return successResponse(res, 'Eleva LMS Backend API is healthy', healthData, HTTP_STATUS.OK);
  });
}
