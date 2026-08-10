import { FindingService } from '../services/finding.service.js';
import { successResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';

export class FindingController {
  static list = asyncHandler(async (req, res) => {
    // The agent server answers with a bare array; wrapping it keeps the shape
    // consistent with every other list endpoint here.
    const findings = await FindingService.list(req.query);
    return successResponse(res, 'Findings retrieved successfully', { findings });
  });

  static summary = asyncHandler(async (req, res) => {
    const summary = await FindingService.summary();
    return successResponse(res, 'Findings summary retrieved successfully', { summary });
  });

  static getById = asyncHandler(async (req, res) => {
    const finding = await FindingService.getById(req.params.id);
    return successResponse(res, 'Finding retrieved successfully', { finding });
  });

  static resolve = asyncHandler(async (req, res) => {
    // req.user.sub, never req.body — the client does not get to say who it is.
    const finding = await FindingService.resolve(req.params.id, req.body, req.user.sub);
    return successResponse(res, 'Finding resolved successfully', { finding });
  });
}
