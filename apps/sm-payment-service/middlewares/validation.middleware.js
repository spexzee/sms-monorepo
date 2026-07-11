// apps/sm-payment-service/middlewares/validation.middleware.js

/**
 * Generic Request Validation Middleware executor
 * 
 * @param {Function} validatorFunc - validator instance function
 * @returns {Function} - Express Middleware
 */
const validateBody = (validatorFunc) => {
    return (req, res, next) => {
        const { isValid, errors } = validatorFunc(req.body);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }
        next();
    };
};

module.exports = {
    validateBody
};
