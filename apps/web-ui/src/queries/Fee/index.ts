// apps/web-ui/src/queries/Fee/index.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ApiResponse } from "../../types";
import type {
    FeeCategory,
    FeeStructure,
    StudentFeeAccount,
    FeePayment,
    FeeReceipt,
    FeeDiscount,
    StudentDiscount,
    FeeAdjustment,
    DashboardStats,
    Defaulter
} from "../../types/fee.types";

// Query Keys Registry
export const feeKeys = {
    all: ['fees'] as const,
    categories: (schoolId: string) => [...feeKeys.all, 'categories', schoolId] as const,
    structures: (schoolId: string) => [...feeKeys.all, 'structures', schoolId] as const,
    structure: (schoolId: string, id: string) => [...feeKeys.all, 'structure', schoolId, id] as const,
    assignments: (schoolId: string) => [...feeKeys.all, 'assignments', schoolId] as const,
    assignment: (schoolId: string, id: string) => [...feeKeys.all, 'assignment', schoolId, id] as const,
    studentAccounts: (schoolId: string, studentId: string) => [...feeKeys.all, 'studentAccounts', schoolId, studentId] as const,
    payments: (schoolId: string) => [...feeKeys.all, 'payments', schoolId] as const,
    payment: (schoolId: string, id: string) => [...feeKeys.all, 'payment', schoolId, id] as const,
    studentPayments: (schoolId: string, studentId: string) => [...feeKeys.all, 'studentPayments', schoolId, studentId] as const,
    receipts: (schoolId: string) => [...feeKeys.all, 'receipts', schoolId] as const,
    receipt: (schoolId: string, id: string) => [...feeKeys.all, 'receipt', schoolId, id] as const,
    studentReceipts: (schoolId: string, studentId: string) => [...feeKeys.all, 'studentReceipts', schoolId, studentId] as const,
    discounts: (schoolId: string) => [...feeKeys.all, 'discounts', schoolId] as const,
    studentDiscounts: (schoolId: string, studentId: string) => [...feeKeys.all, 'studentDiscounts', schoolId, studentId] as const,
    adjustments: (schoolId: string) => [...feeKeys.all, 'adjustments', schoolId] as const,
    dashboardStats: (schoolId: string) => [...feeKeys.all, 'dashboardStats', schoolId] as const,
    defaulters: (schoolId: string) => [...feeKeys.all, 'defaulters', schoolId] as const,
    reports: (schoolId: string, type: string) => [...feeKeys.all, 'reports', schoolId, type] as const,
};

// ── Fee Categories Hooks ──

export const useGetFeeCategories = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.categories(schoolId), params],
        queryFn: () => useApi<ApiResponse<FeeCategory[]>>("GET", `/api/school/${schoolId}/fees/categories`, undefined, params),
        enabled: !!schoolId
    });
};

export const useCreateFeeCategory = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<FeeCategory>>("POST", `/api/school/${schoolId}/fees/categories`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.categories(schoolId) });
        }
    });
};

export const useUpdateFeeCategory = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ categoryId, data }: { categoryId: string; data: any }) => 
            useApi<ApiResponse<FeeCategory>>("PUT", `/api/school/${schoolId}/fees/categories/${categoryId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.categories(schoolId) });
        }
    });
};

export const useToggleFeeCategory = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (categoryId: string) => useApi<ApiResponse<FeeCategory>>("PATCH", `/api/school/${schoolId}/fees/categories/${categoryId}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.categories(schoolId) });
        }
    });
};

export const useDeleteFeeCategory = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (categoryId: string) => useApi<ApiResponse<void>>("DELETE", `/api/school/${schoolId}/fees/categories/${categoryId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.categories(schoolId) });
        }
    });
};


// ── Fee Structures Hooks ──

export const useGetFeeStructures = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.structures(schoolId), params],
        queryFn: () => useApi<ApiResponse<FeeStructure[]>>("GET", `/api/school/${schoolId}/fees/structures`, undefined, params),
        enabled: !!schoolId
    });
};

export const useGetFeeStructureById = (schoolId: string, structureId: string) => {
    return useQuery({
        queryKey: feeKeys.structure(schoolId, structureId),
        queryFn: () => useApi<ApiResponse<FeeStructure>>("GET", `/api/school/${schoolId}/fees/structures/${structureId}`),
        enabled: !!schoolId && !!structureId
    });
};

export const useCreateFeeStructure = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<FeeStructure>>("POST", `/api/school/${schoolId}/fees/structures`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.structures(schoolId) });
        }
    });
};

export const useUpdateFeeStructure = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ structureId, data }: { structureId: string; data: any }) => 
            useApi<ApiResponse<FeeStructure>>("PUT", `/api/school/${schoolId}/fees/structures/${structureId}`, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: feeKeys.structures(schoolId) });
            queryClient.invalidateQueries({ queryKey: feeKeys.structure(schoolId, variables.structureId) });
        }
    });
};

export const usePublishFeeStructure = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (structureId: string) => useApi<ApiResponse<FeeStructure>>("PATCH", `/api/school/${schoolId}/fees/structures/${structureId}/publish`),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: feeKeys.structures(schoolId) });
            queryClient.invalidateQueries({ queryKey: feeKeys.structure(schoolId, variables) });
        }
    });
};

export const useArchiveFeeStructure = (schoolId: string, structureId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => useApi<ApiResponse<FeeStructure>>("PATCH", `/api/school/${schoolId}/fees/structures/${structureId}/archive`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.structures(schoolId) });
            queryClient.invalidateQueries({ queryKey: feeKeys.structure(schoolId, structureId) });
        }
    });
};

export const useCloneFeeStructure = (schoolId: string, structureId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { newName?: string }) => useApi<ApiResponse<FeeStructure>>("POST", `/api/school/${schoolId}/fees/structures/${structureId}/clone`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.structures(schoolId) });
        }
    });
};

export const useDeleteFeeStructure = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (structureId: string) => useApi<ApiResponse<void>>("DELETE", `/api/school/${schoolId}/fees/structures/${structureId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.structures(schoolId) });
        }
    });
};


// ── Student Fee Assignments Hooks ──

export const useGetFeeAssignments = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.assignments(schoolId), params],
        queryFn: () => useApi<ApiResponse<StudentFeeAccount[]>>("GET", `/api/school/${schoolId}/fees/assignments`, undefined, params),
        enabled: !!schoolId
    });
};

export const useGetFeeAssignmentById = (schoolId: string, accountId: string) => {
    return useQuery({
        queryKey: feeKeys.assignment(schoolId, accountId),
        queryFn: () => useApi<ApiResponse<StudentFeeAccount>>("GET", `/api/school/${schoolId}/fees/assignments/${accountId}`),
        enabled: !!schoolId && !!accountId
    });
};

export const useGetStudentFeeAccounts = (schoolId: string, studentId: string) => {
    return useQuery({
        queryKey: feeKeys.studentAccounts(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<StudentFeeAccount[]>>("GET", `/api/school/${schoolId}/fees/assignments/student/${studentId}`),
        enabled: !!schoolId && !!studentId
    });
};

export const useAssignFeeStructure = (schoolId: string, structureId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<any>>("POST", `/api/school/${schoolId}/fees/assignments/structures/${structureId}/assign`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.assignments(schoolId) });
        }
    });
};

export const useUpdateAccountNotes = (schoolId: string, accountId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { adminNotes: string }) => useApi<ApiResponse<StudentFeeAccount>>("PATCH", `/api/school/${schoolId}/fees/assignments/${accountId}/notes`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.assignment(schoolId, accountId) });
        }
    });
};

export const useFreezeAccount = (schoolId: string, accountId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => useApi<ApiResponse<StudentFeeAccount>>("PATCH", `/api/school/${schoolId}/fees/assignments/${accountId}/freeze`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.assignment(schoolId, accountId) });
        }
    });
};

export const useUnfreezeAccount = (schoolId: string, accountId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => useApi<ApiResponse<StudentFeeAccount>>("PATCH", `/api/school/${schoolId}/fees/assignments/${accountId}/unfreeze`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.assignment(schoolId, accountId) });
        }
    });
};


// ── Payments & Transactions Hooks ──

export const useRecordPayment = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<any>>("POST", `/api/school/${schoolId}/fees/payments`, data),
        onSuccess: (_res, variables) => {
            queryClient.invalidateQueries({ queryKey: feeKeys.payments(schoolId) });
            if (variables.studentId) {
                queryClient.invalidateQueries({ queryKey: feeKeys.studentAccounts(schoolId, variables.studentId) });
                queryClient.invalidateQueries({ queryKey: feeKeys.studentPayments(schoolId, variables.studentId) });
                queryClient.invalidateQueries({ queryKey: feeKeys.studentReceipts(schoolId, variables.studentId) });
            }
            if (variables.accountId) {
                queryClient.invalidateQueries({ queryKey: feeKeys.assignment(schoolId, variables.accountId) });
            }
            queryClient.invalidateQueries({ queryKey: feeKeys.dashboardStats(schoolId) });
        }
    });
};

export const useGetPayments = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.payments(schoolId), params],
        queryFn: () => useApi<ApiResponse<FeePayment[]>>("GET", `/api/school/${schoolId}/fees/payments`, undefined, params),
        enabled: !!schoolId
    });
};

export const useGetPaymentById = (schoolId: string, transactionId: string) => {
    return useQuery({
        queryKey: feeKeys.payment(schoolId, transactionId),
        queryFn: () => useApi<ApiResponse<FeePayment>>("GET", `/api/school/${schoolId}/fees/payments/${transactionId}`),
        enabled: !!schoolId && !!transactionId
    });
};

export const useGetPaymentsByStudent = (schoolId: string, studentId: string) => {
    return useQuery({
        queryKey: feeKeys.studentPayments(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<FeePayment[]>>("GET", `/api/school/${schoolId}/fees/payments/student/${studentId}`),
        enabled: !!schoolId && !!studentId
    });
};

export const useIssueRefund = (schoolId: string, paymentId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<any>>("POST", `/api/school/${schoolId}/fees/payments/${paymentId}/refund`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.payments(schoolId) });
            queryClient.invalidateQueries({ queryKey: feeKeys.dashboardStats(schoolId) });
        }
    });
};


// ── Receipts Hooks ──

export const useGetReceiptById = (schoolId: string, receiptId: string) => {
    return useQuery({
        queryKey: feeKeys.receipt(schoolId, receiptId),
        queryFn: () => useApi<ApiResponse<FeeReceipt>>("GET", `/api/school/${schoolId}/fees/receipts/${receiptId}`),
        enabled: !!schoolId && !!receiptId
    });
};

export const useGetStudentReceipts = (schoolId: string, studentId: string) => {
    return useQuery({
        queryKey: feeKeys.studentReceipts(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<FeeReceipt[]>>("GET", `/api/school/${schoolId}/fees/receipts/student/${studentId}`),
        enabled: !!schoolId && !!studentId
    });
};


// ── Discounts & Scholarships Hooks ──

export const useGetDiscounts = (schoolId: string) => {
    return useQuery({
        queryKey: feeKeys.discounts(schoolId),
        queryFn: () => useApi<ApiResponse<FeeDiscount[]>>("GET", `/api/school/${schoolId}/fees/discounts`),
        enabled: !!schoolId
    });
};

export const useCreateDiscount = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<FeeDiscount>>("POST", `/api/school/${schoolId}/fees/discounts`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.discounts(schoolId) });
        }
    });
};

export const useUpdateDiscount = (schoolId: string, discountId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<FeeDiscount>>("PUT", `/api/school/${schoolId}/fees/discounts/${discountId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.discounts(schoolId) });
        }
    });
};

export const useDeleteDiscount = (schoolId: string, discountId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => useApi<ApiResponse<void>>("DELETE", `/api/school/${schoolId}/fees/discounts/${discountId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.discounts(schoolId) });
        }
    });
};

export const useApplyDiscountToStudent = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<any>>("POST", `/api/school/${schoolId}/fees/student-discounts/apply`, data),
        onSuccess: (_res, variables) => {
            if (variables.studentId) {
                queryClient.invalidateQueries({ queryKey: feeKeys.studentAccounts(schoolId, variables.studentId) });
                queryClient.invalidateQueries({ queryKey: feeKeys.studentDiscounts(schoolId, variables.studentId) });
            }
            queryClient.invalidateQueries({ queryKey: feeKeys.dashboardStats(schoolId) });
        }
    });
};

export const useRemoveStudentDiscount = (schoolId: string, studentDiscountId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => useApi<ApiResponse<any>>("DELETE", `/api/school/${schoolId}/fees/student-discounts/apply/${studentDiscountId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feeKeys.all });
        }
    });
};

export const useGetStudentDiscounts = (schoolId: string, studentId: string) => {
    return useQuery({
        queryKey: feeKeys.studentDiscounts(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<StudentDiscount[]>>("GET", `/api/school/${schoolId}/fees/student-discounts/student/${studentId}`),
        enabled: !!schoolId && !!studentId
    });
};


// ── Manual Adjustments Hooks ──

export const useCreateAdjustment = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<any>>("POST", `/api/school/${schoolId}/fees/adjustments`, data),
        onSuccess: (_res, variables) => {
            if (variables.studentId) {
                queryClient.invalidateQueries({ queryKey: feeKeys.studentAccounts(schoolId, variables.studentId) });
            }
            queryClient.invalidateQueries({ queryKey: feeKeys.dashboardStats(schoolId) });
        }
    });
};

export const useApplyWaiver = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => useApi<ApiResponse<any>>("POST", `/api/school/${schoolId}/fees/adjustments/waiver`, data),
        onSuccess: (_res, variables) => {
            if (variables.studentId) {
                queryClient.invalidateQueries({ queryKey: feeKeys.studentAccounts(schoolId, variables.studentId) });
            }
            queryClient.invalidateQueries({ queryKey: feeKeys.dashboardStats(schoolId) });
        }
    });
};

export const useGetAdjustments = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.adjustments(schoolId), params],
        queryFn: () => useApi<ApiResponse<FeeAdjustment[]>>("GET", `/api/school/${schoolId}/fees/adjustments`, undefined, params),
        enabled: !!schoolId
    });
};


// ── Dashboard & Reports Hooks ──

export const useGetFeeDashboardStats = (schoolId: string) => {
    return useQuery({
        queryKey: feeKeys.dashboardStats(schoolId),
        queryFn: () => useApi<ApiResponse<DashboardStats>>("GET", `/api/school/${schoolId}/fees/dashboard/stats`),
        enabled: !!schoolId
    });
};

export const useGetFeeDefaulters = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.defaulters(schoolId), params],
        queryFn: () => useApi<ApiResponse<Defaulter[]>>("GET", `/api/school/${schoolId}/fees/dashboard/defaulters`, undefined, params),
        enabled: !!schoolId
    });
};

export const useGetPendingFeesReport = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.reports(schoolId, 'pending'), params],
        queryFn: () => useApi<ApiResponse<any>>("GET", `/api/school/${schoolId}/fees/dashboard/pending`, undefined, params),
        enabled: !!schoolId
    });
};

export const useGetTodayCollectionReport = (schoolId: string) => {
    return useQuery({
        queryKey: feeKeys.reports(schoolId, 'todayCollection'),
        queryFn: () => useApi<ApiResponse<any>>("GET", `/api/school/${schoolId}/fees/dashboard/collection/today`),
        enabled: !!schoolId
    });
};

export const useGetMonthlyCollectionReport = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.reports(schoolId, 'monthlyCollection'), params],
        queryFn: () => useApi<ApiResponse<any>>("GET", `/api/school/${schoolId}/fees/dashboard/collection/monthly`, undefined, params),
        enabled: !!schoolId
    });
};

export const useGetClasswiseCollectionReport = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.reports(schoolId, 'classwiseCollection'), params],
        queryFn: () => useApi<ApiResponse<any>>("GET", `/api/school/${schoolId}/fees/dashboard/collection/classwise`, undefined, params),
        enabled: !!schoolId
    });
};

export const useGetDiscountReport = (schoolId: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: [...feeKeys.reports(schoolId, 'discounts'), params],
        queryFn: () => useApi<ApiResponse<any>>("GET", `/api/school/${schoolId}/fees/dashboard/discounts`, undefined, params),
        enabled: !!schoolId
    });
};
