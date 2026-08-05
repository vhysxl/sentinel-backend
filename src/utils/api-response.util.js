import { HTTP_STATUS } from '../constants/index.js';

export const successResponse = (res, message, data = null, statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * The only way this API reports failure. Never carries a stack trace, a driver
 * message, or any other internal detail — those belong in the logs only.
 */
export const errorResponse = (
  res,
  message,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors = null
) => {
  const body = {
    success: false,
    message
  };

  // Field-level validation errors, already mapped to { field, message }.
  if (errors) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};

/**
 * Builds an error carrying the status the client should receive. Anything
 * thrown WITHOUT this marker is treated as unexpected and masked as a 500.
 */
export const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
