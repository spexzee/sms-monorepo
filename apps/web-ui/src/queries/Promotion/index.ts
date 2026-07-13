import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ApiResponse } from "../../types";

// Types
export interface StudentPromotionRow {
    studentId: string;
    firstName: string;
    lastName: string;
    class: string;
    section?: string;
    rollNumber?: string;
    academicYear?: string;
}

export interface PromotionClassItem {
    classId: string;
    name: string;
    sections: Array<{ sectionId: string; name: string }>;
}

export interface PromotionPreviewResponse {
    students: StudentPromotionRow[];
    classes: PromotionClassItem[];
}

export interface PromotionLogEntry {
    _id: string;
    schoolId: string;
    academicYear: string;
    promotedBy: string;
    promotionType: "single_class" | "bulk" | "repeat" | "graduate" | "archive";
    classId?: string;
    targetClassId?: string;
    students: Array<{
        studentId: string;
        fromClass: string;
        fromSection?: string;
        toClass: string;
        toSection?: string;
        status: "promoted" | "repeated" | "graduated";
    }>;
    status: "pending" | "completed" | "rolled_back";
    rollbackAvailable: boolean;
    notes?: string;
    executedAt: string;
    createdAt: string;
}

// Query keys
export const promotionKeys = {
    all: (schoolId: string) => ["promotions", schoolId] as const,
    preview: (schoolId: string) => ["promotions", schoolId, "preview"] as const,
    logs: (schoolId: string) => ["promotions", schoolId, "logs"] as const,
};

// 1. Get Promotion Preview
export const useGetPromotionPreview = (schoolId: string) => {
    return useQuery({
        queryKey: promotionKeys.preview(schoolId),
        queryFn: () =>
            useApi<ApiResponse<PromotionPreviewResponse>>(
                "GET",
                `/api/school/${schoolId}/promotion/preview`
            ),
        enabled: !!schoolId,
    });
};

// 2. Promote single class
export const usePromoteClass = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            classId: string;
            sectionId?: string;
            targetClassId: string;
            targetSectionId?: string;
            newAcademicYear: string;
            repeaters?: string[];
            graduates?: string[];
            notes?: string;
        }) =>
            useApi<ApiResponse<PromotionLogEntry>>(
                "POST",
                `/api/school/${schoolId}/promotion/promote-class`,
                payload
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: promotionKeys.all(schoolId) });
        },
    });
};

// 3. Bulk promote classes
export const useBulkPromote = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            promotions: Array<{
                classId: string;
                targetClassId: string;
                targetSectionId?: string;
            }>;
            newAcademicYear: string;
            repeaters?: string[];
            graduates?: string[];
            notes?: string;
        }) =>
            useApi<ApiResponse<PromotionLogEntry>>(
                "POST",
                `/api/school/${schoolId}/promotion/bulk`,
                payload
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: promotionKeys.all(schoolId) });
        },
    });
};

// 4. Mark students repeating
export const useMarkRepeat = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            studentIds: string[];
            newAcademicYear: string;
            notes?: string;
        }) =>
            useApi<ApiResponse<PromotionLogEntry>>(
                "POST",
                `/api/school/${schoolId}/promotion/repeat`,
                payload
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: promotionKeys.all(schoolId) });
        },
    });
};

// 5. Graduate students
export const useGraduateBatch = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            studentIds: string[];
            newAcademicYear: string;
            notes?: string;
        }) =>
            useApi<ApiResponse<PromotionLogEntry>>(
                "POST",
                `/api/school/${schoolId}/promotion/graduate`,
                payload
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: promotionKeys.all(schoolId) });
        },
    });
};

// 6. Archive academic year
export const useArchiveYear = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            newAcademicYear: string;
            notes?: string;
        }) =>
            useApi<ApiResponse<PromotionLogEntry>>(
                "POST",
                `/api/school/${schoolId}/promotion/archive`,
                payload
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: promotionKeys.all(schoolId) });
            // Invalidate school settings query if any
            queryClient.invalidateQueries({ queryKey: ["school", schoolId] });
        },
    });
};

// 7. Get promotion history logs
export const useGetPromotionLogs = (schoolId: string) => {
    return useQuery({
        queryKey: promotionKeys.logs(schoolId),
        queryFn: () =>
            useApi<ApiResponse<PromotionLogEntry[]>>(
                "GET",
                `/api/school/${schoolId}/promotion/logs`
            ),
        enabled: !!schoolId,
    });
};

// 8. Rollback a promotion action
export const useRollbackPromotion = (schoolId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (logId: string) =>
            useApi<ApiResponse<PromotionLogEntry>>(
                "POST",
                `/api/school/${schoolId}/promotion/rollback/${logId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: promotionKeys.all(schoolId) });
        },
    });
};
