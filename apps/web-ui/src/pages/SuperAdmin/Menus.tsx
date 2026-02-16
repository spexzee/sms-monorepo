import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Autocomplete,
  Grid,
  InputAdornment,
  Button,
  Badge,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Star as StarIcon,
  Add as AddIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowRight as ExpandRightIcon,
  RestartAlt as RestartAltIcon,
  SubdirectoryArrowRight as SubMenuIcon,
} from "@mui/icons-material";
import AddMenusDialog from "../../components/Dialogs/AddMenusDialog";
import ConfirmationDialog from "../../components/Dialogs/ConfirmationDialog";
import { useGetMenus, useDeleteMenu } from "../../queries/Menus";
import { useGetSchools } from "../../queries/School";
import { useAuth } from "../../context/AuthContext";
import { useNotificationStore } from "../../stores/notificationStore";
import ManageMenuAccessDialog from "../../components/Dialogs/ManageMenuAccessDialog";
import HtmlTooltip from "../../components/Common/HtmlTooltip";
import type { Menu } from "../../types";

const ROLE_COLOR_MAP: Record<
  string,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
> = {
  super_admin: "error",
  sch_admin: "primary",
  teacher: "warning",
  student: "success",
  parent: "warning",
  SA: "error",
  A: "primary",
  T: "warning",
  S: "success",
  P: "warning",
};

const getRoleChipColor = (value: string) => {
  if (ROLE_COLOR_MAP[value]) return ROLE_COLOR_MAP[value];
  const prefix = value.match(/^(SA|A|T|S|P)/)?.[0];
  return (prefix && ROLE_COLOR_MAP[prefix]) || "default";
};

interface GroupedMenu extends Menu {
  children: Menu[];
}

const Menus = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | undefined>(undefined);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [manageMenu, setManageMenu] = useState<Menu | null>(null);
  const [manageMode, setManageMode] = useState<"roles" | "schools">("roles");
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedSchool, setAppliedSchool] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [schoolInput, setSchoolInput] = useState<string | null>(null);

  const { showNotification } = useNotificationStore();

  // Use global pagination state from AuthContext
  const { page, setPage, limit, setLimit } = useAuth();

  // Reset page when applied filters change
  useEffect(() => {
    setPage(1);
  }, [appliedSearch, appliedSchool, setPage]);

  // Fetch menus and schools
  const {
    data: menusData,
    isLoading: isLoadingMenus,
    error,
  } = useGetMenus(page, limit, appliedSearch, appliedSchool || undefined);
  const { data: schoolsData, isLoading: isLoadingSchools } = useGetSchools();

  const menus = menusData?.data || [];
  const schools = schoolsData?.data || [];

  const isLoading = isLoadingMenus || isLoadingSchools;

  // Group menus: main menus with their submenus nested
  const groupedMenus = useMemo<GroupedMenu[]>(() => {
    const mainMenus = menus.filter((m: Menu) => m.menuType === "main");
    const subMenus = menus.filter((m: Menu) => m.menuType === "sub");

    return mainMenus.map((main: Menu) => ({
      ...main,
      children: subMenus.filter((sub: Menu) => sub.parentMenuId === main.menuId),
    }));
  }, [menus]);

  const handleToggleExpand = (menuId: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  };

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    setAppliedSchool(schoolInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSchoolInput(null);
    setAppliedSearch("");
    setAppliedSchool(null);
    setPage(1);
  };

  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedMenu(undefined);
  };

  const deleteMutation = useDeleteMenu();

  const handleEditClick = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (menu: Menu) => {
    setMenuToDelete(menu);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (menuToDelete) {
      try {
        const res = await deleteMutation.mutateAsync(menuToDelete.menuId);
        setDeleteConfirmationOpen(false);
        setMenuToDelete(null);
        showNotification(res.message, "success");
      } catch (err: any) {
        console.error("Failed to delete menu:", err);
        showNotification(err.message || "Failed to delete menu", "error");
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setMenuToDelete(null);
  };

  // ---- Shared cell renderers ----

  const renderMenuName = (menu: Menu, isChild = false) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {isChild && (
        <SubMenuIcon sx={{ fontSize: 16, color: "text.secondary", mr: 0.5 }} />
      )}
      <Typography variant="body2" sx={{ fontWeight: isChild ? 400 : 600 }}>
        {menu.menuName}
      </Typography>
      {menu.defaultMenu && (
        <Tooltip title="Default menu (auto-assigned to new schools)">
          <StarIcon sx={{ fontSize: 16, color: "warning.main", ml: 0.5 }} />
        </Tooltip>
      )}
    </Box>
  );

  const renderOrder = (menu: Menu) => {
    const value = menu.menuOrder;
    if (!value) return null;
    const orders = Array.isArray(value) ? value : [value];
    return (
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {orders.map((orderItem: string | number) => {
          const order = String(orderItem);
          const color = getRoleChipColor(order);
          return (
            <Chip
              key={order}
              label={order}
              size="small"
              variant="outlined"
              color={color}
              sx={{ fontWeight: 600, minWidth: "50px" }}
            />
          );
        })}
      </Box>
    );
  };

  const renderRoles = (menu: Menu) => {
    const value = menu.menuAccessRoles;
    if (!value) return null;
    const roles = Array.isArray(value) ? value : [value];
    const deactivatedRoles = menu.deactivatedRoles || [];
    const activeCount = roles.filter(
      (r: string) => !deactivatedRoles.includes(r),
    ).length;

    const rolesList = roles.map((role: string) => {
      const isDeactivated = deactivatedRoles.includes(role);
      const label = role.replace(/_/g, " ");
      return (
        <Box
          key={role}
          sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
        >
          <Chip
            label={label}
            size="small"
            variant={isDeactivated ? "outlined" : "filled"}
            color={isDeactivated ? "default" : getRoleChipColor(role)}
            sx={{
              textTransform: "capitalize",
              fontSize: "0.75rem",
              opacity: isDeactivated ? 0.6 : 1,
            }}
          />
          <Typography
            variant="caption"
            color={isDeactivated ? "error" : "success.main"}
            sx={{ fontWeight: 600 }}
          >
            {isDeactivated ? "Inactive" : "Active"}
          </Typography>
        </Box>
      );
    });

    return (
      <HtmlTooltip
        title={
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              Assigned Roles ({activeCount}/{roles.length} active)
            </Typography>
            {rolesList}
          </Box>
        }
        arrow
        placement="right"
      >
        <Badge badgeContent={roles.length} color="primary" sx={{ mr: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              setManageMenu(menu);
              setManageMode("roles");
            }}
            sx={{ minWidth: "auto", fontSize: "0.75rem", py: 0.5, px: 1.5 }}
          >
            Manage
          </Button>
        </Badge>
      </HtmlTooltip>
    );
  };

  const renderSchools = (menu: Menu) => {
    const value = menu.schoolId;
    if (!value) return null;
    const ids = Array.isArray(value) ? value : [value];
    const deactivatedSchools = menu.deactivatedSchools || [];

    if (ids.length === 0)
      return (
        <Chip label="Global" size="small" variant="outlined" color="info" />
      );

    const activeCount = ids.filter(
      (id: string) => !deactivatedSchools.includes(id),
    ).length;

    const schoolsList = ids.map((id: string) => {
      const school = schools.find((s: any) => s.schoolId === id);
      const isDeactivated = deactivatedSchools.includes(id);
      return (
        <Box
          key={id}
          sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
        >
          <Chip
            label={school ? school.schoolName : id}
            size="small"
            variant={isDeactivated ? "outlined" : "filled"}
            color={isDeactivated ? "default" : "primary"}
            sx={{ fontSize: "0.75rem", opacity: isDeactivated ? 0.6 : 1 }}
          />
          <Typography
            variant="caption"
            color={isDeactivated ? "error" : "success.main"}
            sx={{ fontWeight: 600 }}
          >
            {isDeactivated ? "Disabled" : "Enabled"}
          </Typography>
        </Box>
      );
    });

    return (
      <HtmlTooltip
        title={
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              Assigned Schools ({activeCount}/{ids.length} enabled)
            </Typography>
            {schoolsList}
          </Box>
        }
        arrow
        placement="right"
      >
        <Badge badgeContent={ids.length} color="primary" sx={{ mr: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              setManageMenu(menu);
              setManageMode("schools");
            }}
            sx={{ minWidth: "auto", fontSize: "0.75rem", py: 0.5, px: 1.5 }}
          >
            Manage
          </Button>
        </Badge>
      </HtmlTooltip>
    );
  };

  const renderActions = (menu: Menu) => (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick(menu);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(menu);
          }}
          disabled={deleteMutation.isPending}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  // ---- Render a single menu row ----
  const renderMenuRow = (menu: Menu, isChild = false) => (
    <TableRow
      key={menu.menuId}
      hover
      sx={{
        bgcolor: isChild ? "action.hover" : undefined,
        "& > td": { py: 1.2 },
      }}
    >
      {/* Menu Name (with expand button for main menus) */}
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", pl: isChild ? 4 : 0 }}>
          {!isChild && (
            <Box sx={{ width: 32 }}>
              {(menu as GroupedMenu).children?.length > 0 ? (
                <IconButton
                  size="small"
                  onClick={() => handleToggleExpand(menu.menuId)}
                  sx={{ p: 0.5 }}
                >
                  {expandedMenus.has(menu.menuId) ? (
                    <ExpandMoreIcon fontSize="small" />
                  ) : (
                    <ExpandRightIcon fontSize="small" />
                  )}
                </IconButton>
              ) : null}
            </Box>
          )}
          {renderMenuName(menu, isChild)}
        </Box>
      </TableCell>

      {/* Order */}
      <TableCell>{renderOrder(menu)}</TableCell>

      {/* Path */}
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {menu.menuUrl}
        </Typography>
      </TableCell>

      {/* Roles */}
      <TableCell>{renderRoles(menu)}</TableCell>

      {/* Schools */}
      <TableCell>{renderSchools(menu)}</TableCell>

      {/* Action */}
      <TableCell>{renderActions(menu)}</TableCell>
    </TableRow>
  );

  return (
    <Box>
      {/* Filters Section */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search menus or roles..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              options={schools}
              getOptionLabel={(school: any) => school.schoolName || ""}
              value={
                schools.find((s: any) => s.schoolId === schoolInput) || null
              }
              onChange={(_event, newValue) => {
                setSchoolInput(newValue ? newValue.schoolId : null);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by School"
                  variant="outlined"
                  size="small"
                  placeholder="Select a school"
                />
              )}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                fullWidth
                sx={{ height: "40px" }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RestartAltIcon />}
                onClick={handleClearFilters}
                fullWidth
                sx={{ height: "40px" }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600} color="text.primary">
          Menus Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
        >
          Add Menu
        </Button>
      </Box>

      {/* Table */}
      <Paper
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <TableContainer>
          <Table size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: "grey.100",
                  "& th": {
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    py: 1.5,
                    color: "text.primary",
                  },
                }}
              >
                <TableCell sx={{ width: "22%" }}>Menu Name</TableCell>
                <TableCell sx={{ width: "15%" }}>Order</TableCell>
                <TableCell sx={{ width: "18%" }}>Path</TableCell>
                <TableCell sx={{ width: "15%" }}>Roles</TableCell>
                <TableCell sx={{ width: "15%" }}>Schools</TableCell>
                <TableCell sx={{ width: "15%" }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="error">
                      {(error as any).message || "Failed to load menus"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : groupedMenus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No menus found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groupedMenus.map((mainMenu) => (
                  <>
                    {/* Main menu row */}
                    {renderMenuRow(mainMenu)}

                    {/* Submenu rows rendered directly in same table */}
                    {mainMenu.children.length > 0 &&
                      expandedMenus.has(mainMenu.menuId) &&
                      mainMenu.children.map((subMenu) =>
                        renderMenuRow(subMenu, true),
                      )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={menusData?.pagination?.total || 0}
          page={page - 1}
          onPageChange={(_e, newPage) => setPage(newPage + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[10, 20, 30, 50]}
        />
      </Paper>

      <AddMenusDialog
        open={isAddDialogOpen}
        onClose={handleCloseDialog}
        onSuccess={(msg) => showNotification(msg, "success")}
        menuToEdit={selectedMenu}
      />

      <ConfirmationDialog
        open={deleteConfirmationOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Menu"
        description={`Are you sure you want to delete the menu "${menuToDelete?.menuName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ManageMenuAccessDialog
        open={!!manageMenu}
        onClose={() => setManageMenu(null)}
        menu={manageMenu}
        mode={manageMode}
        schools={schools}
        onSuccess={(msg) => showNotification(msg, "success")}
      />
    </Box>
  );
};

export default Menus;
