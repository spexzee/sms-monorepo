const {
  getPaginationParams,
  formatPaginationResponse,
} = require("@sms/shared/utils");

/**
 * Middleware for pagination
 */
const paginate = (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  req.pagination = { page, limit, skip };
  next();
};

module.exports = {
  getPaginationParams,
  formatPaginationResponse,
  paginate,
};
