// apps/web-ui/src/queries/transport/index.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ApiResponse } from "../../types/index";
import type {
  TransportRoute,
  TransportSummary,
  TransportNotification,
  TransportStop,
  TransportStopStudent,
  TransportDriver,
  CreateTransportRoutePayload,
  SendNotificationPayload,
  BusStatusPayload,
  StudentRouteResult,
} from "../../types/transport";

const base = (schoolId: string) => `/api/transport/school/${schoolId}`;

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES — CRUD
// ─────────────────────────────────────────────────────────────────────────────

export const fetchTransportRoutes = (schoolId: string) =>
  useApi<ApiResponse<TransportRoute[]>>("GET", `${base(schoolId)}/routes`);

export const useGetTransportRoutes = (schoolId: string) =>
  useQuery({
    queryKey: ["transport-routes", schoolId],
    queryFn: () => fetchTransportRoutes(schoolId),
    enabled: !!schoolId,
  });

export const fetchTransportRoute = (schoolId: string, routeId: string) =>
  useApi<ApiResponse<TransportRoute>>("GET", `${base(schoolId)}/routes/${routeId}`);

export const useGetTransportRoute = (schoolId: string, routeId: string) =>
  useQuery({
    queryKey: ["transport-route", schoolId, routeId],
    queryFn: () => fetchTransportRoute(schoolId, routeId),
    enabled: !!schoolId && !!routeId,
  });

export const createTransportRoute = (schoolId: string, payload: CreateTransportRoutePayload) =>
  useApi<ApiResponse<TransportRoute>>("POST", `${base(schoolId)}/routes`, payload);

export const useCreateTransportRoute = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransportRoutePayload) => createTransportRoute(schoolId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["transport-summary", schoolId] });
    },
  });
};

export const updateTransportRoute = (
  schoolId: string,
  routeId: string,
  payload: Partial<CreateTransportRoutePayload>
) =>
  useApi<ApiResponse<TransportRoute>>("PUT", `${base(schoolId)}/routes/${routeId}`, payload);

export const useUpdateTransportRoute = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Partial<CreateTransportRoutePayload> }) =>
      updateTransportRoute(schoolId, routeId, data),
    onSuccess: (_, { routeId }) => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["transport-route", schoolId, routeId] });
      queryClient.invalidateQueries({ queryKey: ["transport-summary", schoolId] });
    },
  });
};

export const deleteTransportRoute = (schoolId: string, routeId: string) =>
  useApi<{ message: string }>("DELETE", `${base(schoolId)}/routes/${routeId}`);

export const useDeleteTransportRoute = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => deleteTransportRoute(schoolId, routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["transport-summary", schoolId] });
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// STOPS
// ─────────────────────────────────────────────────────────────────────────────

export const useAddStop = (schoolId: string, routeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stop: Partial<TransportStop>) =>
      useApi<ApiResponse<TransportRoute>>("POST", `${base(schoolId)}/routes/${routeId}/stops`, stop),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["transport-route", schoolId, routeId] });
    },
  });
};

export const useUpdateStop = (schoolId: string, routeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stopId, data }: { stopId: string; data: Partial<TransportStop> }) =>
      useApi<ApiResponse<TransportRoute>>(
        "PUT",
        `${base(schoolId)}/routes/${routeId}/stops/${stopId}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["transport-route", schoolId, routeId] });
    },
  });
};

export const useRemoveStop = (schoolId: string, routeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stopId: string) =>
      useApi<ApiResponse<TransportRoute>>(
        "DELETE",
        `${base(schoolId)}/routes/${routeId}/stops/${stopId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["transport-route", schoolId, routeId] });
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER
// ─────────────────────────────────────────────────────────────────────────────

export const useUpdateDriver = (schoolId: string, routeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (driver: Partial<TransportDriver>) =>
      useApi<ApiResponse<TransportRoute>>(
        "PUT",
        `${base(schoolId)}/routes/${routeId}/driver`,
        driver
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["transport-route", schoolId, routeId] });
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

export const useAssignStudents = (schoolId: string, routeId: string, stopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (students: TransportStopStudent[]) =>
      useApi<ApiResponse<TransportRoute>>(
        "POST",
        `${base(schoolId)}/routes/${routeId}/stops/${stopId}/students`,
        { students }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["transport-route", schoolId, routeId] });
    },
  });
};

export const useRemoveStudent = (schoolId: string, routeId: string, stopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      useApi<ApiResponse<TransportRoute>>(
        "DELETE",
        `${base(schoolId)}/routes/${routeId}/stops/${stopId}/students/${studentId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ROUTE LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

export const useGetStudentRoute = (schoolId: string, studentId: string) =>
  useQuery({
    queryKey: ["student-route", schoolId, studentId],
    queryFn: () =>
      useApi<ApiResponse<StudentRouteResult>>("GET", `${base(schoolId)}/student/${studentId}/route`),
    enabled: !!schoolId && !!studentId,
  });

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export const useGetTransportSummary = (schoolId: string) =>
  useQuery({
    queryKey: ["transport-summary", schoolId],
    queryFn: () =>
      useApi<ApiResponse<TransportSummary>>("GET", `${base(schoolId)}/summary`),
    enabled: !!schoolId,
  });

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const useSendTransportNotification = (schoolId: string) =>
  useMutation({
    mutationFn: (payload: SendNotificationPayload) =>
      useApi<{ success: boolean; message: string; data: { count: number } }>(
        "POST",
        `${base(schoolId)}/notifications/send`,
        payload
      ),
  });

export const useUpdateBusStatus = (schoolId: string) =>
  useMutation({
    mutationFn: (payload: BusStatusPayload) =>
      useApi<{ success: boolean; message: string; data: { count: number } }>(
        "POST",
        `${base(schoolId)}/notifications/bus-status`,
        payload
      ),
  });

export const useGetTransportNotifications = (
  schoolId: string,
  params?: { limit?: number; skip?: number; type?: string }
) =>
  useQuery({
    queryKey: ["transport-notifications", schoolId, params],
    queryFn: () =>
      useApi<ApiResponse<TransportNotification[]>>(
        "GET",
        `${base(schoolId)}/notifications`,
        undefined,
        params as Record<string, unknown>
      ),
    enabled: !!schoolId,
  });
