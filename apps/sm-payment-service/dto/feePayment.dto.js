// apps/sm-payment-service/dto/feePayment.dto.js

class RecordPaymentDTO {
    constructor(data) {
        this.studentId = data.studentId;
        this.accountId = data.accountId;
        this.paymentMode = data.paymentMode;
        this.paymentDate = data.paymentDate;
        this.referenceNumber = data.referenceNumber;
        this.bankName = data.bankName;
        this.remarks = data.remarks;
        this.paymentItems = data.paymentItems; // array of { feeCategoryId, paidAmount, lateFeeAmount }
    }
}

class RefundPaymentDTO {
    constructor(data) {
        this.refundAmount = data.refundAmount;
        this.refundMode = data.refundMode;
        this.refundReferenceNumber = data.refundReferenceNumber;
        this.reason = data.reason;
        this.affectedItems = data.affectedItems; // array of { feeCategoryId, amount }
    }
}

class FeePaymentResponseDTO {
    constructor(model) {
        this.paymentId = model.paymentId || model.transactionId;
        this.transactionId = model.transactionId;
        this.studentId = model.studentId;
        this.studentName = model.studentName;
        this.paymentMode = model.paymentMode;
        this.paymentDate = model.paymentDate;
        this.referenceNumber = model.referenceNumber;
        this.totalAmountReceived = model.amount;
        this.status = model.status || 'completed';
        this.receiptId = model.receiptId;
    }
}

module.exports = {
    RecordPaymentDTO,
    RefundPaymentDTO,
    FeePaymentResponseDTO
};
