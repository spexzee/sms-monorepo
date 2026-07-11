// apps/sm-payment-service/middlewares/error.middleware.js

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Unhandled Error in Payment Service:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    return res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || []
    });
};

module.exports = {
    errorHandler
};
