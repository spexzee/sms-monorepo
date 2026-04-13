import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
  ApiResponse,
  Teacher,
  CreateTeacherPayload,
  UpdateTeacherPayload,
  TeacherFilters,
} from "../../types";

// Query Keys
export const teacherKeys = {
  all: (schoolId: string) => ["teachers", schoolId] as const,
  detail: (schoolId: string, teacherId: string) =>
    ["teachers", schoolId, teacherId] as const,
  filtered: (schoolId: string, filters: TeacherFilters) =>
    ["teachers", schoolId, filters] as const,
};

// Get all teachers in a school
export const useGetTeachers = (schoolId: string, filters?: TeacherFilters) => {
  return useQuery({
    queryKey: teacherKeys.filtered(schoolId, filters || {}),
    queryFn: () => {
      const params = { ...filters };
      let url = `/api/school/${schoolId}/teachers`;

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.status) queryParams.append("status", params.status);
      if (params.department)
        queryParams.append("department", params.department);
      if (params.search) queryParams.append("search", params.search);

      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;

      return useApi<ApiResponse<Teacher[]>>("GET", url);
    },
    enabled: !!schoolId,
  });
};

// Get teacher by ID
export const useGetTeacherById = (schoolId: string, teacherId: string) => {
  return useQuery({
    queryKey: teacherKeys.detail(schoolId, teacherId),
    queryFn: () =>
      useApi<ApiResponse<Teacher>>(
        "GET",
        `/api/school/${schoolId}/teachers/${teacherId}`
      ),
    enabled: !!schoolId && !!teacherId,
  });
};

// Create teacher — also invalidates class cache so Classes page reflects new assignments
export const useCreateTeacher = (schoolId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeacherPayload) =>
      useApi<ApiResponse<Teacher>>(
        "POST",
        `/api/school/${schoolId}/teachers`,
        data
      ),
    onSuccess: () => {
      // Invalidate ALL teacher query variants (filtered, detail, all)
      queryClient.invalidateQueries({ queryKey: ["teachers", schoolId], exact: false });
      // Also refresh classes so section.classTeacherId changes are visible
      queryClient.invalidateQueries({ queryKey: ["classes", schoolId], exact: false });
    },
  });
};

// Update teacher
export const useUpdateTeacher = (schoolId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teacherId,
      data,
    }: {
      teacherId: string;
      data: UpdateTeacherPayload | Record<string, unknown>;
    }) =>
      useApi<ApiResponse<Teacher>>(
        "PUT",
        `/api/school/${schoolId}/teachers/${teacherId}`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teachers", schoolId], exact: false });
      queryClient.invalidateQueries({
        queryKey: teacherKeys.detail(schoolId, variables.teacherId),
      });
      // Refresh classes in case section.classTeacherId changed
      queryClient.invalidateQueries({ queryKey: ["classes", schoolId], exact: false });
    },
  });
};

// Delete teacher (soft delete)
export const useDeleteTeacher = (schoolId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teacherId: string) =>
      useApi<ApiResponse<Teacher>>(
        "DELETE",
        `/api/school/${schoolId}/teachers/${teacherId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers", schoolId], exact: false });
      queryClient.invalidateQueries({ queryKey: ["classes", schoolId], exact: false });
    },
  });
};
