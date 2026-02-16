import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
  ApiResponse,
  Student,
  CreateStudentPayload,
  UpdateStudentPayload,
  StudentFilters,
} from "../../types";

// Query Keys
export const studentKeys = {
  all: (schoolId: string) => ["students", schoolId] as const,
  detail: (schoolId: string, studentId: string) =>
    ["students", schoolId, studentId] as const,
  filtered: (schoolId: string, filters: StudentFilters) =>
    ["students", schoolId, filters] as const,
};

// Get all students in a school
export const useGetStudents = (schoolId: string, filters?: StudentFilters) => {
  return useQuery({
    queryKey: studentKeys.filtered(schoolId, filters || {}),
    queryFn: () => {
      let url = `/api/school/${schoolId}/students`;
      const queryParams = new URLSearchParams();

      if (filters) {
        if (filters.page) queryParams.append("page", filters.page.toString());
        if (filters.limit)
          queryParams.append("limit", filters.limit.toString());
        if (filters.class) queryParams.append("class", filters.class);
        if (filters.section) queryParams.append("section", filters.section);
        if (filters.status) queryParams.append("status", filters.status);
        if (filters.parentId) queryParams.append("parentId", filters.parentId);
      }

      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;

      return useApi<ApiResponse<Student[]>>("GET", url);
    },
    enabled: !!schoolId,
  });
};

// Get student by ID
export const useGetStudentById = (schoolId: string, studentId: string) => {
  return useQuery({
    queryKey: studentKeys.detail(schoolId, studentId),
    queryFn: () =>
      useApi<ApiResponse<Student>>(
        "GET",
        `/api/school/${schoolId}/students/${studentId}`
      ),
    enabled: !!schoolId && !!studentId,
  });
};

// Create student
export const useCreateStudent = (schoolId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStudentPayload) =>
      useApi<ApiResponse<Student>>(
        "POST",
        `/api/school/${schoolId}/students`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all(schoolId) });
    },
  });
};

// Update student
export const useUpdateStudent = (schoolId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      data,
    }: {
      studentId: string;
      data: UpdateStudentPayload;
    }) =>
      useApi<ApiResponse<Student>>(
        "PUT",
        `/api/school/${schoolId}/students/${studentId}`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all(schoolId) });
      queryClient.invalidateQueries({
        queryKey: studentKeys.detail(schoolId, variables.studentId),
      });
    },
  });
};

// Delete student (soft delete)
export const useDeleteStudent = (schoolId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) =>
      useApi<ApiResponse<Student>>(
        "DELETE",
        `/api/school/${schoolId}/students/${studentId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all(schoolId) });
    },
  });
};

// Search students for autocomplete
export const searchStudentsApi = (schoolId: string, query: string) =>
  useApi<ApiResponse<Student[]>>(
    "GET",
    `/api/school/${schoolId}/students/search`,
    undefined,
    { query }
  );

// Bulk create students (from Excel upload)
export const useBulkCreateStudents = (schoolId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (students: Partial<CreateStudentPayload>[]) =>
      useApi<
        ApiResponse<{
          inserted: number;
          failed: number;
          total: number;
          errors: { row: number; message: string }[];
        }>
      >("POST", `/api/school/${schoolId}/students/bulk-upload`, { students }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all(schoolId) });
    },
  });
};

