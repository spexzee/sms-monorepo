import { Navigate, Outlet, useLocation } from "react-router-dom";
import TokenService from "../queries/token/tokenService";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import {
  useGetSuperAdminMenus,
  useGetSchoolAdminMenus,
  useGetUserMenus,
} from "../queries/Menus";
import { Box, CircularProgress } from "@mui/material";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = TokenService.getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (TokenService.isTokenExpired()) {
    TokenService.removeToken();
    return <Navigate to="/login" replace />;
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


  // Build activePaths from RAW menus (not sidebar-filtered) so routes hidden
  // from the sidebar (showInSidebar: false) are still accessible via navigation.
  const buildPathsFromRawMenus = (rawMenus: any[], role: string): string[] => {
    const rolePrefixMap: Record<string, string> = {
      super_admin: "/super-admin",
      sch_admin: "/school-admin",
      teacher: "/teacher",
      student: "/student",
      parent: "/parent",
    };
    const basePath = rolePrefixMap[role] || "";
    const paths: string[] = [];
    (rawMenus || []).forEach((menu: any) => {
      if (menu.menuUrl) {
        const url = menu.menuUrl.startsWith("/")
          ? menu.menuUrl
          : `/${menu.menuUrl}`;
        paths.push(`${basePath}${url}`);
      }
    });
    return paths;
  };

  const activePaths = buildPathsFromRawMenus(menus || [], userRole || "");

  const currentPath = location.pathname;

  const isAllowed = activePaths.some((path) => {
    // Convert dynamic segments like :studentId to a regex wildcard
    if (path.includes(":")) {
      const pattern = path.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}(/.*)?$`);
      return regex.test(currentPath);
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  });

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
