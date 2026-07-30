import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { errorResponse } from '../utils/api-response.util.js';

export const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route not found: ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND);
};
