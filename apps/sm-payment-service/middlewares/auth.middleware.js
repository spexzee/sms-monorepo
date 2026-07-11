// apps/sm-payment-service/middlewares/auth.middleware.js

/**
 * Auth Middleware Placeholders
 * References and delegates logic to shared auth middlewares package
 */
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');

module.exports = {
    Authenticated,
    authorizeRoles
};
