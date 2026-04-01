// apps/web-ui/src/queries/transport/index.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ApiResponse } from "../../types/index";
import type { TransportRoute, CreateTransportRoutePayload } from "../../types/transport";

/** 
 * GET all transport routes for a school 
 */
export const fetchTransportRoutes = async (schoolId: string) => {
  return await useApi<ApiResponse<TransportRoute[]>>("GET", `/api/transport/school/${schoolId}`);
};

export const useGetTransportRoutes = (schoolId: string) => {
  return useQuery({
    queryKey: ["transport-routes", schoolId],
    queryFn: () => fetchTransportRoutes(schoolId),
    enabled: !!schoolId,
  });
};

/** 
 * GET a single transport route 
 */
export const fetchTransportRoute = async (schoolId: string, routeId: string) => {
  return await useApi<ApiResponse<TransportRoute>>("GET", `/api/transport/school/${schoolId}/${routeId}`);
};

export const useGetTransportRoute = (schoolId: string, routeId: string) => {
  return useQuery({
    queryKey: ["transport-route", schoolId, routeId],
    queryFn: () => fetchTransportRoute(schoolId, routeId),
    enabled: !!schoolId && !!routeId,
  });
};

/** 
 * POST a new transport route 
 */
export const createTransportRoute = async (schoolId: string, payload: CreateTransportRoutePayload) => {
  return await useApi<ApiResponse<TransportRoute>>("POST", `/api/transport/school/${schoolId}`, payload);
};

export const useCreateTransportRoute = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransportRoutePayload) => createTransportRoute(schoolId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
    },
  });
};

/** 
 * PUT (Update) an existing transport route 
 */
export const updateTransportRoute = async (
  schoolId: string,
  routeId: string,
  payload: Partial<CreateTransportRoutePayload>
) => {
  return await useApi<ApiResponse<TransportRoute>>("PUT", `/api/transport/school/${schoolId}/${routeId}`, payload);
};

export const useUpdateTransportRoute = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Partial<CreateTransportRoutePayload> }) => 
      updateTransportRoute(schoolId, routeId, data),
    onSuccess: (_, { routeId }) => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["transport-route", schoolId, routeId] });
    },
  });
};

/** 
 * DELETE a transport route 
 */
export const deleteTransportRoute = async (schoolId: string, routeId: string) => {
  return await useApi<{ message: string }>("DELETE", `/api/transport/school/${schoolId}/${routeId}`);
};

export const useDeleteTransportRoute = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => deleteTransportRoute(schoolId, routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes", schoolId] });
    },
  });
};
