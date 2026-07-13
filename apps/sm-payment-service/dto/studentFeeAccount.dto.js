// apps/sm-payment-service/dto/studentFeeAccount.dto.js

class AssignFeeStructureDTO {
    constructor(data) {
        this.classId = data.classId;
        this.sectionId = data.sectionId;
        this.studentIds = data.studentIds;
        this.isProRata = data.isProRata;
        this.proRataConfig = data.proRataConfig;
    }
}

class StudentFeeAccountResponseDTO {
    constructor(model) {
        this.assignmentId = model.assignmentId;
        this.studentId = model.studentId;
        this.studentName = model.studentName;
        this.classId = model.classId;
        this.className = model.className;
        this.sectionId = model.sectionId;
        this.sectionName = model.sectionName;
        this.rollNumber = model.rollNumber;
        this.academicYear = model.academicYear;
        this.feeStructureId = model.feeStructureId;
        this.feeBreakdown = model.feeBreakdown;
        this.installmentSchedule = model.installmentSchedule;
        this.totalOriginalFees = model.totalOriginalFees;
        this.totalAdjustments = model.totalAdjustments;
        this.totalDiscount = model.totalDiscount;
        this.totalWaived = model.totalWaived;
        this.netFees = model.netFees;
        this.totalPaid = model.totalPaid;
        this.totalRefunded = model.totalRefunded;
        this.totalLateFee = model.totalLateFee;
        this.totalBalance = model.totalBalance;
        this.accountStatus = model.accountStatus;
        this.lastTransactionDate = model.lastTransactionDate;
        this.lastTransactionType = model.lastTransactionType;
    }
}

module.exports = {
    AssignFeeStructureDTO,
    StudentFeeAccountResponseDTO
};
