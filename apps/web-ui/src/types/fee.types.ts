// apps/web-ui/src/types/fee.types.ts

export interface FeeCategory {
    feeCategoryId: string;
    schoolId: string;
    name: string;
    categoryType: 'academic' | 'transport' | 'hostel' | 'activity' | 'exam' | 'uniform' | 'library' | 'technology' | 'miscellaneous' | string;
    isRecurring: boolean;
    isMandatory: boolean;
    description?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface FeeItem {
    feeCategoryId: string;
    categoryName: string;
    categoryType?: string;
    amount: number;
    frequency: 'one_time' | 'monthly' | 'quarterly' | 'half_yearly' | 'annually' | 'per_term';
    dueDayOfMonth: number;
    isOptional: boolean;
    displayOrder: number;
}

export interface Installment {
    installmentNumber: number;
    label: string;
    dueDate: string;
    percentageOfTotal: number;
}

export interface LateFeeRule {
    gracePeriodDays: number;
    lateFeeType: 'flat' | 'percentage';
    lateFeeValue: number;
    lateFeeFrequency: 'once' | 'daily' | 'weekly' | 'monthly';
    maxLateFeeAmount: number;
}

export interface FeeStructure {
    feeStructureId: string;
    schoolId: string;
    name: string;
    academicYear: string;
    applicableClasses: string[];
    feeItems: FeeItem[];
    installmentEnabled: boolean;
    installments: Installment[];
    lateFeeEnabled: boolean;
    lateFeeRule?: LateFeeRule | null;
    status: 'draft' | 'published' | 'archived';
    totalFeeAmount: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface FeeBreakdownItem {
    feeCategoryId: string;
    categoryName: string;
    categoryType?: string;
    originalAmount: number;
    adjustments: number;
    discountAmount: number;
    waivedAmount: number;
    netAmount: number;
    paidAmount: number;
    refundedAmount: number;
    lateFeeCharged: number;
    balanceAmount: number;
    dueDate: string | null;
    status: 'unpaid' | 'partial' | 'paid' | 'waived' | 'refunded';
}

export interface InstallmentRecord {
    installmentNumber: number;
    label: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    lateFeeApplied: number;
    status: 'pending' | 'partial' | 'paid' | 'overdue';
}

export interface StudentFeeAccount {
    assignmentId: string;
    schoolId: string;
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    sectionId?: string;
    sectionName?: string;
    rollNumber?: string;
    academicYear: string;
    feeStructureId: string;
    feeStructureName: string;
    feeBreakdown: FeeBreakdownItem[];
    installmentSchedule: InstallmentRecord[];
    totalOriginalFees: number;
    totalAdjustments: number;
    totalDiscount: number;
    totalWaived: number;
    netFees: number;
    totalPaid: number;
    totalRefunded: number;
    totalLateFee: number;
    totalBalance: number;
    accountStatus: 'active' | 'paid' | 'partially_paid' | 'overdue' | 'waived' | 'frozen' | 'transferred_out' | 'transferred_in';
    lastTransactionDate?: string | null;
    lastTransactionType?: string | null;
    isProRata: boolean;
    adminNotes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PaymentItem {
    feeCategoryId: string;
    categoryName: string;
    installmentNumber?: number | null;
    outstandingAmount: number;
    lateFeeAmount: number;
    paidAmount: number;
}

export interface FeePayment {
    transactionId: string;
    paymentId?: string;
    schoolId: string;
    paymentType: 'payment' | 'refund';
    studentId: string;
    studentName: string;
    assignmentId: string;
    academicYear: string;
    paymentMode: 'cash' | 'upi' | 'card' | 'cheque' | 'bank_transfer' | 'online';
    paymentDate: string;
    referenceNumber?: string;
    bankName?: string;
    remarks?: string;
    paymentItems: PaymentItem[];
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    status: 'completed' | 'pending_verification' | 'failed' | 'refunded' | 'partially_refunded';
    receiptId?: string;
    createdAt?: string;
}

export interface ReceiptLineItem {
    description: string;
    feeCategoryId?: string;
    installmentLabel?: string | null;
    feeAmount: number;
    lateFeeAmount: number;
    lineTotal: number;
}

export interface FeeReceipt {
    receiptId: string;
    receiptNumber: string;
    schoolId: string;
    academicYear: string;
    paymentId: string;
    student: {
        studentId: string;
        studentName: string;
        className?: string;
        sectionName?: string;
        rollNumber?: string;
    };
    school: {
        schoolId: string;
        schoolName: string;
        schoolAddress?: string;
        schoolPhone?: string;
        schoolEmail?: string;
        schoolLogo?: string;
    };
    paymentDate: string;
    paymentMode: string;
    referenceNumber?: string;
    bankName?: string;
    lineItems: ReceiptLineItem[];
    totalFeeAmount: number;
    totalLateFeeIncluded: number;
    totalAmountPaid: number;
    totalFeesForYear: number;
    totalPaidToDate: number;
    balanceRemaining: number;
    isVoided: boolean;
    voidReason?: string;
    createdAt?: string;
}

export interface FeeDiscount {
    discountId: string;
    schoolId: string;
    name: string;
    description?: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    appliesTo: 'all_fees' | 'tuition_only' | 'specific_category';
    specificCategoryId?: string | null;
    isActive: boolean;
}

export interface StudentDiscount {
    studentDiscountId: string;
    schoolId: string;
    studentId: string;
    studentName: string;
    discountId: string;
    discountName: string;
    academicYear: string;
    transactionId: string;
    computedAmount: number;
    appliedToCategories: string[];
    notes?: string;
    createdAt?: string;
}

export interface FeeAdjustment {
    adjustmentId: string;
    schoolId: string;
    studentId: string;
    studentName: string;
    accountId: string;
    academicYear: string;
    adjustmentType: 'credit' | 'debit';
    amount: number;
    reason: string;
    feeCategoryId: string;
    categoryName: string;
    transactionId: string;
    createdAt?: string;
}

export interface DashboardStats {
    totalExpected: number;
    totalCollected: number;
    totalOutstanding: number;
    totalStudentsWithDues: number;
    todayCollection: number;
    collectionPercentage: number;
}

export interface Defaulter {
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    sectionName?: string;
    rollNumber?: string;
    totalBalance: number;
    lastTransactionDate?: string | null;
}
