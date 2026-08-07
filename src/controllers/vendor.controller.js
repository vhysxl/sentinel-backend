import { VendorService } from '../services/vendor.service.js';
import { successResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { HTTP_STATUS } from '../constants/index.js';

export class VendorController {
  static list = asyncHandler(async (req, res) => {
    const vendors = await VendorService.list();
    return successResponse(res, 'Vendors retrieved successfully', { vendors });
  });

  static create = asyncHandler(async (req, res) => {
    const vendor = await VendorService.create(req.body);
    return successResponse(res, 'Vendor created successfully', { vendor }, HTTP_STATUS.CREATED);
  });

  static getById = asyncHandler(async (req, res) => {
    const vendor = await VendorService.getById(req.params.id);
    return successResponse(res, 'Vendor retrieved successfully', { vendor });
  });

  static update = asyncHandler(async (req, res) => {
    const vendor = await VendorService.update(req.params.id, req.body);
    return successResponse(res, 'Vendor updated successfully', { vendor });
  });
}
