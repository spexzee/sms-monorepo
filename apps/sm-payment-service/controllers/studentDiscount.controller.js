// apps/sm-payment-service/controllers/studentDiscount.controller.js

class StudentDiscountController {
    async applyDiscount(req, res, next) {
        // Placeholder: delegates student discount mapping to StudentDiscountService
    }

    async removeDiscount(req, res, next) {
        // Placeholder: delegates discount manual reversal logic to StudentDiscountService
    }

    async getStudentDiscounts(req, res, next) {
        // Placeholder: delegates query to StudentDiscountService
    }
}

module.exports = new StudentDiscountController();
