/**
 * Pagination utility functions
 */

/**
 * Get pagination parameters from query
 * @param {Object} query - The request query object
 * @returns {Object} - { page, limit, skip }
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, parseInt(query.limit) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Format the paginated response
 * @param {Array} data - The data for the current page
 * @param {number} total - Total count of records
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} - Formatted response object
 */
const formatPaginationResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  getPaginationParams,
  formatPaginationResponse,
};
