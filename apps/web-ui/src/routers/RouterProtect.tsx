import { Navigate, Outlet, useLocation } from "react-router-dom";
import TokenService from "../queries/token/tokenService";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import {
  useGetSuperAdminMenus,
  useGetSchoolAdminMenus,
  useGetUserMenus,
} from "../queries/Menus";
import { transformMenuData } from "../pages/Sidebar/SidebarUtils";
import { Box, CircularProgress } from "@mui/material";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = TokenService.getToken();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (TokenService.isTokenExpired()) {
    TokenService.removeToken();
    return <Navigate to="/" replace />;
  }

  const userRole = TokenService.getRole();
  const location = useLocation();
  const schoolId = TokenService.getSchoolId();

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const { data: superAdminMenus, isLoading: isLoadingSuperAdmin } =
    useGetSuperAdminMenus(userRole === "super_admin" ? userRole : "");

  const { data: schoolAdminMenus, isLoading: isLoadingSchoolAdmin } =
    useGetSchoolAdminMenus(
      userRole === "sch_admin" ? schoolId || "" : "",
      userRole === "sch_admin" ? userRole : "",
    );

  const { data: userMenus, isLoading: isLoadingUserMenus } = useGetUserMenus(
    userRole === "teacher" || userRole === "student" || userRole === "parent"
      ? schoolId || ""
      : "",
    userRole === "teacher" || userRole === "student" || userRole === "parent"
      ? userRole || ""
      : "",
  );

  const isLoading =
    isLoadingSuperAdmin || isLoadingSchoolAdmin || isLoadingUserMenus;

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f8fafc",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const menus =
    userRole === "super_admin"
      ? superAdminMenus?.data
      : userRole === "sch_admin"
        ? schoolAdminMenus?.data
        : userMenus?.data || [];

  const transformedMenus = transformMenuData(menus || [], userRole || "");

  const activePaths: string[] = [];
  transformedMenus.forEach((item) => {
    if (item.path) activePaths.push(item.path);
    if (item.subItems) {
      item.subItems.forEach((sub) => {
        if (sub.path) activePaths.push(sub.path);
      });
    }
  });

  const currentPath = location.pathname;

  const isAllowed = activePaths.some(
    (path) => currentPath === path || currentPath.startsWith(path + "/"),
  );

  const rolePrefixes = [
    "/super-admin",
    "/school-admin",
    "/teacher",
    "/student",
    "/parent",
  ];
  const isRoleRoute = rolePrefixes.some(
    (prefix) => currentPath === prefix || currentPath.startsWith(prefix + "/"),
  );

  if (isRoleRoute && !isAllowed) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;
