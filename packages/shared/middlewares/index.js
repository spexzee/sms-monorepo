const auth = require("./auth");
const authorizeRole = require("./authorizeRole");
const rateLimiter = require("./rateLimiter");

module.exports = {
  ...auth,
  ...authorizeRole,
  ...rateLimiter,
};
