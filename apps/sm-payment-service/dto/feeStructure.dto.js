// apps/sm-payment-service/dto/feeStructure.dto.js

class CreateFeeStructureDTO {
    constructor(data) {
        this.name = data.name;
        this.academicYear = data.academicYear;
        this.applicableClasses = data.applicableClasses;
        this.feeItems = data.feeItems;
        this.installmentEnabled = data.installmentEnabled;
        this.installments = data.installments;
        this.lateFeeEnabled = data.lateFeeEnabled;
        this.lateFeeRule = data.lateFeeRule;
    }
}

class UpdateFeeStructureDTO {
    constructor(data) {
        if (data.name !== undefined) this.name = data.name;
        if (data.applicableClasses !== undefined) this.applicableClasses = data.applicableClasses;
        if (data.feeItems !== undefined) this.feeItems = data.feeItems;
        if (data.installmentEnabled !== undefined) this.installmentEnabled = data.installmentEnabled;
        if (data.installments !== undefined) this.installments = data.installments;
        if (data.lateFeeEnabled !== undefined) this.lateFeeEnabled = data.lateFeeEnabled;
        if (data.lateFeeRule !== undefined) this.lateFeeRule = data.lateFeeRule;
    }
}

class FeeStructureResponseDTO {
    constructor(model) {
        this.feeStructureId = model.feeStructureId;
        this.name = model.name;
        this.academicYear = model.academicYear;
        this.applicableClasses = model.applicableClasses;
        this.feeItems = model.feeItems;
        this.installmentEnabled = model.installmentEnabled;
        this.installments = model.installments;
        this.lateFeeEnabled = model.lateFeeEnabled;
        this.lateFeeRule = model.lateFeeRule;
        this.status = model.status;
        this.totalFeeAmount = model.totalFeeAmount;
        this.createdAt = model.createdAt;
    }
}

module.exports = {
    CreateFeeStructureDTO,
    UpdateFeeStructureDTO,
    FeeStructureResponseDTO
};
