const rateLimit = require('express-rate-limit');

/**
 * Common rate limiter middleware for all services
 * Default: 100 requests per 15 minutes per IP
 */
const commonRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes",
    },
    // Skip rate limiting for localhost in development if needed
    skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '::1',
});

/**
 * Stricter rate limiter for sensitive operations (Auth, etc.)
 * Default: 5 requests per 15 minutes per IP
 */
const strictRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts, please try again after 15 minutes",
    },
});

module.exports = {
    commonRateLimiter,
    strictRateLimiter
};
