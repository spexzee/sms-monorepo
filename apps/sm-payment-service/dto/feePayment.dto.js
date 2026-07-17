// apps/sm-payment-service/dto/feePayment.dto.js

class RecordPaymentDTO {
    constructor(data) {
        this.studentId = data.studentId;
        this.accountId = data.accountId;
        this.paymentMode = data.paymentMode;
        this.paymentDate = data.paymentDate;
        this.referenceNumber = data.referenceNumber;
        this.bankName = data.bankName;
        this.remarks = data.remarks || data.notes;
        
        const rawItems = data.paymentItems || data.items || [];
        this.paymentItems = rawItems.map(item => ({
            feeCategoryId: item.feeCategoryId,
            paidAmount: item.paidAmount !== undefined ? item.paidAmount : (item.amountPaid !== undefined ? item.amountPaid : item.amount),
            lateFeeAmount: item.lateFeeAmount !== undefined ? item.lateFeeAmount : (item.lateFeePaid !== undefined ? item.lateFeePaid : 0)
        }));
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
        this.paymentId = model.paymentId;
        this.transactionId = model.paymentId;
        this.studentId = model.studentId;
        this.studentName = model.studentName;
        this.academicYear = model.academicYear;
        this.paymentMode = model.paymentMode;
        this.paymentDate = model.paymentDate;
        this.referenceNumber = model.referenceNumber;
        this.totalAmountReceived = model.totalAmountReceived;
        this.status = model.status || 'completed';
        this.receiptId = model.receiptId;
    }
}

module.exports = {
    RecordPaymentDTO,
    RefundPaymentDTO,
    FeePaymentResponseDTO
};
