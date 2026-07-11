// apps/sm-payment-service/dto/feeReceipt.dto.js

class FeeReceiptResponseDTO {
    constructor(model) {
        this.receiptId = model.receiptId;
        this.receiptNumber = model.receiptNumber;
        this.academicYear = model.academicYear;
        this.paymentId = model.paymentId;
        this.student = model.student; // snapshot
        this.school = model.school; // snapshot
        this.paymentDate = model.paymentDate;
        this.paymentMode = model.paymentMode;
        this.referenceNumber = model.referenceNumber;
        this.lineItems = model.lineItems;
        this.totalFeeAmount = model.totalFeeAmount;
        this.totalLateFeeIncluded = model.totalLateFeeIncluded;
        this.totalAmountPaid = model.totalAmountPaid;
        this.balanceRemaining = model.balanceRemaining;
        this.isVoided = model.isVoided;
        this.voidReason = model.voidReason;
    }
}

module.exports = {
    FeeReceiptResponseDTO
};
