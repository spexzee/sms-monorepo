// apps/sm-payment-service/dto/feeCategory.dto.js

class CreateFeeCategoryDTO {
    constructor(data) {
        this.name = data.name;
        this.categoryType = data.categoryType;
        this.isRecurring = data.isRecurring;
        this.isMandatory = data.isMandatory;
        this.description = data.description;
    }
}

class UpdateFeeCategoryDTO {
    constructor(data) {
        if (data.name !== undefined) this.name = data.name;
        if (data.categoryType !== undefined) this.categoryType = data.categoryType;
        if (data.isRecurring !== undefined) this.isRecurring = data.isRecurring;
        if (data.isMandatory !== undefined) this.isMandatory = data.isMandatory;
        if (data.description !== undefined) this.description = data.description;
    }
}

class FeeCategoryResponseDTO {
    constructor(model) {
        this.feeCategoryId = model.feeCategoryId;
        this.schoolId = model.schoolId;
        this.name = model.name;
        this.categoryType = model.categoryType;
        this.isRecurring = model.isRecurring;
        this.isMandatory = model.isMandatory;
        this.description = model.description;
        this.isActive = model.isActive;
        this.createdAt = model.createdAt;
    }
}

module.exports = {
    CreateFeeCategoryDTO,
    UpdateFeeCategoryDTO,
    FeeCategoryResponseDTO
};
