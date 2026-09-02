/**
 * Standard API Response Utilities
 * Provides consistent response formats across all backend endpoints.
 */

const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

const sendPaginated = (res, items, total, page, limit, key = 'items', extraData = {}) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const totalPages = Math.ceil(total / limitNum) || 1;

  return res.status(200).json({
    success: true,
    data: {
      [key]: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      ...extraData,
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
};
