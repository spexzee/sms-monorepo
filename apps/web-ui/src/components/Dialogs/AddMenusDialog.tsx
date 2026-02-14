import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Checkbox,
  ListItemText,
  Chip,
  Box,
  OutlinedInput,
  InputAdornment,
  Autocomplete,
  Switch,
} from "@mui/material";
import { Close as CloseIcon, Apps as AppsIcon } from "@mui/icons-material";
import { useCreateMenu, useGetMenus, useUpdateMenu } from "../../queries/Menus";
import { useGetSchools } from "../../queries/School";
import type { CreateMenuPayload, Menu } from "../../types";
import IconPickerDialog from "./IconPickerDialog";

interface AddMenusDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  menuToEdit?: Menu;
}

const AddMenusDialog: React.FC<AddMenusDialogProps> = ({
  open,
  onClose,
  onSuccess,
  menuToEdit,
}) => {
  const [formData, setFormData] = useState<CreateMenuPayload>({
    schoolId: [],
    menuName: "",
    menuUrl: "",
    menuIcon: "",
    menuAccessRoles: [],
    hasSubmenu: false,
    parentMenuId: "",
    menuType: "main",
    status: "active",
    menuOrder: "", // string | number, initializing as empty string for auto-gen
    deactivatedRoles: [],
    defaultMenu: false,
  });

  const [menuType, setMenuType] = useState<"main" | "sub">("main");
  const [activeOrderPrefix, setActiveOrderPrefix] = useState("SA"); // To manage which order prefix is currently being edited
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const createMutation = useCreateMenu();
  const updateMutation = useUpdateMenu();
  const { data: schoolsData, isLoading: isLoadingSchools } = useGetSchools();
  const { data: menusData } = useGetMenus();

  const schools = schoolsData?.data || [];
  const menus = menusData?.data || [];

  // Get roles of the selected parent menu
  const selectedParentRoles = useMemo(() => {
    if (menuType !== "sub" || !formData.parentMenuId) return null;
    const parent = menus.find((m: any) => m.menuId === formData.parentMenuId);
    const roles = parent?.menuAccessRoles || [];
    return Array.isArray(roles) ? roles : [roles];
  }, [menuType, formData.parentMenuId, menus]);

  // Automatically suggest roles from the parent menu when a parent is first selected during creation
  useEffect(() => {
    if (!menuToEdit && selectedParentRoles && selectedParentRoles.length > 0) {
      setFormData((prev) => {
        const currentRoles = Array.isArray(prev.menuAccessRoles)
          ? prev.menuAccessRoles
          : [prev.menuAccessRoles];

        const rolesArray = Array.isArray(selectedParentRoles)
          ? selectedParentRoles
          : [selectedParentRoles];

        const missingRoles = rolesArray.filter(
          (role: string) => !currentRoles.includes(role),
        );

        if (missingRoles.length > 0) {
          return {
            ...prev,
            menuAccessRoles: [...currentRoles, ...missingRoles],
          };
        }
        return prev;
      });
    }
  }, [selectedParentRoles, menuToEdit]);

  // Synchronize activeOrderPrefix with available roles
  useEffect(() => {
    const selectedRoles = Array.isArray(formData.menuAccessRoles)
      ? formData.menuAccessRoles
      : [formData.menuAccessRoles];

    const prefixToRoleMap: Record<string, string> = {
      SA: "super_admin",
      A: "sch_admin",
      T: "teacher",
      S: "student",
      P: "parent",
    };

    const currentRole = prefixToRoleMap[activeOrderPrefix];

    // If current prefix is not valid for selected roles, pick the first valid one
    if (
      selectedRoles.length > 0 &&
      (!currentRole || !selectedRoles.includes(currentRole))
    ) {
      const firstRole = selectedRoles[0];
      const newPrefix = Object.keys(prefixToRoleMap).find(
        (key) => prefixToRoleMap[key] === firstRole,
      );
      if (newPrefix) setActiveOrderPrefix(newPrefix);
    }
  }, [formData.menuAccessRoles, activeOrderPrefix]);

  // Filter for potential parent menus (Main Menus that are not submenus themselves)
  const parentMenuOptions =
    menusData?.data?.filter((menu: any) => !menu.parentMenuId) || [];

  // Populate form data when menuToEdit changes or dialog opens
  useEffect(() => {
    if (open && menuToEdit) {
      setFormData({
        schoolId: Array.isArray(menuToEdit.schoolId)
          ? menuToEdit.schoolId
          : menuToEdit.schoolId
            ? [menuToEdit.schoolId]
            : [],
        menuName: menuToEdit.menuName || "",
        menuUrl: menuToEdit.menuUrl || "",
        menuIcon: menuToEdit.menuIcon || "",
        menuAccessRoles: Array.isArray(menuToEdit.menuAccessRoles)
          ? menuToEdit.menuAccessRoles
          : [menuToEdit.menuAccessRoles],
        hasSubmenu: menuToEdit.hasSubmenu || false,
        parentMenuId: menuToEdit.parentMenuId || "",
        menuType: menuToEdit.menuType || "main",
        status: menuToEdit.status || "active",
        menuOrder: menuToEdit.menuOrder ?? "",
        deactivatedRoles: menuToEdit.deactivatedRoles || [],
        defaultMenu: menuToEdit.defaultMenu || false,
      });
      setMenuType(menuToEdit.menuType || "main");
    }
  }, [open, menuToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
    if (errors[name as string]) {
      setErrors((prev) => ({ ...prev, [name as string]: "" }));
    }
  };

  const handleMenuTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = e.target.value as "main" | "sub";
    setMenuType(type);
    setFormData((prev) => ({ ...prev, menuType: type }));
    if (type === "main") {
      setFormData((prev) => ({ ...prev, parentMenuId: "", menuType: type }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.menuName.trim()) newErrors.menuName = "Menu name is required";
    if (!formData.menuUrl.trim()) newErrors.menuUrl = "Menu path is required";
    // menuOrder is now optional (auto-generated if empty)
    // if (formData.menuOrder === undefined || formData.menuOrder === null)
    //   newErrors.menuOrder = "Order is required";
    if (
      !formData.menuAccessRoles ||
      (Array.isArray(formData.menuAccessRoles) &&
        formData.menuAccessRoles.length === 0)
    )
      newErrors.menuAccessRoles = "Role is required";
    // For admin roles (like super_admin), schoolId is not required
    const isSuperAdmin = Array.isArray(formData.menuAccessRoles)
      ? formData.menuAccessRoles.includes("super_admin")
      : formData.menuAccessRoles === "super_admin";

    if (
      !isSuperAdmin &&
      (!formData.schoolId ||
        (Array.isArray(formData.schoolId) && formData.schoolId.length === 0))
    )
      newErrors.schoolId = "At least one school is required";

    if (menuType === "sub" && !formData.parentMenuId?.trim()) {
      newErrors.parentMenuId = "Main Menu Heading is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (menuToEdit) {
        const res = await updateMutation.mutateAsync({
          menuId: menuToEdit.menuId,
          data: formData,
        });
        onSuccess?.(res.message);
      } else {
        const res = await createMutation.mutateAsync(formData);
        onSuccess?.(res.message);
      }
      handleClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setFormData({
      schoolId: [],
      menuName: "",
      menuUrl: "",
      menuIcon: "",
      menuAccessRoles: [],
      hasSubmenu: false,
      parentMenuId: "",
      menuType: "main",
      status: "active",
      menuOrder: "",
      deactivatedRoles: [],
      defaultMenu: false,
    });
    setMenuType("main");
    setErrors({});
    createMutation.reset();
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;
  const errorMessage =
    (createMutation.error as { message?: string })?.message ||
    (updateMutation.error as { message?: string })?.message ||
    "Operation failed";

  // Role options
  const roles = [
    { value: "super_admin", label: "Super Admin" },
    { value: "sch_admin", label: "School Admin" },
    { value: "teacher", label: "Teacher" },
    { value: "student", label: "Student" },
    { value: "parent", label: "Parent" },
  ];

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        sx={{ mt: 5 }}
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {menuToEdit ? "Edit Menu" : "Add New Menu"}
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ height: "500px" }}>
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* School Selection (Multi-select) */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  options={schools}
                  getOptionLabel={(school: any) => school.schoolName || ""}
                  value={schools.filter((s: any) =>
                    Array.isArray(formData.schoolId)
                      ? formData.schoolId.includes(s.schoolId)
                      : formData.schoolId === s.schoolId,
                  )}
                  onChange={(_event, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      schoolId: newValue.map((s: any) => s.schoolId),
                    }));
                    if (errors.schoolId) {
                      setErrors((prev) => ({ ...prev, schoolId: "" }));
                    }
                  }}
                  loading={isLoadingSchools}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Schools"
                      error={!!errors.schoolId}
                      helperText={errors.schoolId}
                      placeholder="Select schools"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.schoolId === value.schoolId
                  }
                  fullWidth
                />
              </Grid>

              {/* Default Menu Toggle */}
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.defaultMenu || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          defaultMenu: e.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  }
                  label="Default Menu (auto-assign to new schools)"
                />
              </Grid>

              {/* Menu Name */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="menuName"
                  label="Menu Name"
                  value={formData.menuName}
                  onChange={handleChange}
                  error={!!errors.menuName}
                  helperText={errors.menuName}
                  required
                  fullWidth
                />
              </Grid>

              {/* Menu Type Selection */}
              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Menu Type</FormLabel>
                  <RadioGroup
                    row
                    name="menuType"
                    value={menuType}
                    onChange={handleMenuTypeChange}
                  >
                    <FormControlLabel
                      value="main"
                      control={<Radio />}
                      label="Main Menu"
                    />
                    <FormControlLabel
                      value="sub"
                      control={<Radio />}
                      label="Sub Menu"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Main Menu Heading (Parent ID) - Conditional */}
              {menuType === "sub" && (
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    options={parentMenuOptions}
                    getOptionLabel={(option: any) => option.menuName || ""}
                    value={
                      parentMenuOptions.find(
                        (m: any) => m.menuId === formData.parentMenuId,
                      ) || null
                    }
                    onChange={(_event, newValue) => {
                      setFormData((prev) => ({
                        ...prev,
                        parentMenuId: newValue ? newValue.menuId : "",
                      }));
                      if (errors.parentMenuId) {
                        setErrors((prev) => ({ ...prev, parentMenuId: "" }));
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Main Menu Heading"
                        error={!!errors.parentMenuId}
                        helperText={errors.parentMenuId}
                        placeholder="Search for a menu..."
                        required
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.menuId === value.menuId
                    }
                    fullWidth
                  />
                </Grid>
              )}

              {/* Menu Path */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="menuUrl"
                  label="Menu Path"
                  value={formData.menuUrl}
                  onChange={handleChange}
                  error={!!errors.menuUrl}
                  helperText={errors.menuUrl}
                  required
                  fullWidth
                />
              </Grid>

              {/* Menu Order - Only show when editing, as it's auto-generated on create */}
              {menuToEdit && (
                <Grid size={{ xs: 12 }}>
                  {/* Existing Codes Display */}
                  <Box
                    sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}
                  >
                    {(Array.isArray(formData.menuOrder)
                      ? formData.menuOrder
                      : [formData.menuOrder]
                    )
                      .filter(Boolean)
                      .map((order) => {
                        const o = String(order);
                        let color:
                          | "default"
                          | "primary"
                          | "secondary"
                          | "error"
                          | "info"
                          | "success"
                          | "warning" = "default";
                        if (o.startsWith("SA")) color = "error";
                        else if (o.startsWith("A")) color = "primary";
                        else if (o.startsWith("T")) color = "warning";
                        else if (o.startsWith("S")) color = "success";
                        else if (o.startsWith("P")) color = "warning";

                        return (
                          <Chip
                            key={o}
                            label={o}
                            size="small"
                            color={color}
                            variant="outlined"
                            onDelete={() => {
                              setFormData((prev) => {
                                const currentOrders = (
                                  Array.isArray(prev.menuOrder)
                                    ? prev.menuOrder
                                    : [prev.menuOrder]
                                )
                                  .filter(Boolean)
                                  .map(String);
                                return {
                                  ...prev,
                                  menuOrder: currentOrders.filter(
                                    (item) => item !== o,
                                  ),
                                };
                              });
                            }}
                          />
                        );
                      })}
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <FormControl sx={{ minWidth: 100 }}>
                      <InputLabel>Prefix</InputLabel>
                      <Select
                        label="Prefix"
                        value={activeOrderPrefix}
                        onChange={(e) => setActiveOrderPrefix(e.target.value)}
                        disabled={!formData.menuAccessRoles?.length}
                      >
                        {[
                          {
                            prefix: "SA",
                            role: "super_admin",
                            label: "SA (Super Admin)",
                          },
                          {
                            prefix: "A",
                            role: "sch_admin",
                            label: "A (School Admin)",
                          },
                          {
                            prefix: "T",
                            role: "teacher",
                            label: "T (Teacher)",
                          },
                          {
                            prefix: "S",
                            role: "student",
                            label: "S (Student)",
                          },
                          { prefix: "P", role: "parent", label: "P (Parent)" },
                        ]
                          .filter((p) => {
                            const selectedRoles = Array.isArray(
                              formData.menuAccessRoles,
                            )
                              ? formData.menuAccessRoles
                              : [formData.menuAccessRoles];
                            return selectedRoles.includes(p.role);
                          })
                          .map((p) => (
                            <MenuItem key={p.prefix} value={p.prefix}>
                              {p.label}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    <TextField
                      name="menuOrderNumber"
                      label="Order No."
                      value={(() => {
                        const orders = Array.isArray(formData.menuOrder)
                          ? formData.menuOrder
                          : [formData.menuOrder];
                        const match = orders.find((o) =>
                          String(o).startsWith(activeOrderPrefix),
                        );
                        return match
                          ? String(match).replace(activeOrderPrefix, "")
                          : "";
                      })()}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        const newCode = `${activeOrderPrefix}${newValue}`;

                        setFormData((prev) => {
                          const currentOrders = (
                            Array.isArray(prev.menuOrder)
                              ? prev.menuOrder
                              : [prev.menuOrder]
                          )
                            .filter(Boolean)
                            .map(String);
                          // Remove any existing code with this prefix
                          const filtered = currentOrders.filter(
                            (o) => !o.startsWith(activeOrderPrefix),
                          );
                          // Add new code if value exists
                          if (newValue) {
                            filtered.push(newCode);
                          }
                          return {
                            ...prev,
                            menuOrder: filtered,
                          };
                        });
                      }}
                      error={!!errors.menuOrder}
                      fullWidth
                      placeholder={`No. for ${activeOrderPrefix}`}
                    />
                  </Box>
                </Grid>
              )}

              {/* Menu Icon */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="menuIcon"
                  label="Menu Icon"
                  value={formData.menuIcon}
                  onClick={() => setIconPickerOpen(true)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setIconPickerOpen(true)}
                          edge="end"
                        >
                          <AppsIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  placeholder="Click to select an icon"
                />
              </Grid>

              {/* Role Selection */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth error={!!errors.menuAccessRoles}>
                  <InputLabel>Roles</InputLabel>
                  <Select
                    name="menuAccessRoles"
                    multiple
                    value={
                      Array.isArray(formData.menuAccessRoles)
                        ? formData.menuAccessRoles
                        : [formData.menuAccessRoles] // Fallback if string
                    }
                    onChange={(e) => handleChange(e as any)}
                    input={<OutlinedInput label="Roles" />}
                    renderValue={(selected) => {
                      const selectedRoles = (
                        Array.isArray(selected) ? selected : [selected]
                      ) as string[];
                      return (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selectedRoles.map((value) => {
                            const roleLabel = roles.find(
                              (r) => r.value === value,
                            )?.label;
                            const isInherited =
                              selectedParentRoles !== null &&
                              selectedParentRoles.includes(value);

                            return (
                              <Chip
                                key={value}
                                label={roleLabel || value}
                                onDelete={
                                  menuToEdit || !isInherited
                                    ? () => {
                                        const currentRoles = Array.isArray(
                                          formData.menuAccessRoles,
                                        )
                                          ? formData.menuAccessRoles
                                          : [formData.menuAccessRoles];
                                        const newRoles = currentRoles.filter(
                                          (r) => r !== value,
                                        );
                                        setFormData((prev) => ({
                                          ...prev,
                                          menuAccessRoles: newRoles,
                                        }));
                                      }
                                    : undefined
                                }
                                onMouseDown={(event) => {
                                  event.stopPropagation();
                                }}
                                sx={{
                                  bgcolor: isInherited
                                    ? "rgba(59, 130, 246, 0.1)"
                                    : undefined,
                                  borderColor: isInherited
                                    ? "rgba(59, 130, 246, 0.5)"
                                    : undefined,
                                }}
                                variant={isInherited ? "outlined" : "filled"}
                              />
                            );
                          })}
                        </Box>
                      );
                    }}
                  >
                    {roles.map((role) => {
                      const selectedArray = Array.isArray(
                        formData.menuAccessRoles,
                      )
                        ? formData.menuAccessRoles
                        : [formData.menuAccessRoles];

                      return (
                        <MenuItem
                          key={role.value}
                          value={role.value}
                          disabled={
                            !menuToEdit &&
                            menuType === "sub" &&
                            selectedParentRoles !== null &&
                            selectedParentRoles.includes(role.value)
                          }
                        >
                          <Checkbox
                            checked={selectedArray.indexOf(role.value) > -1}
                            disabled={
                              !menuToEdit &&
                              menuType === "sub" &&
                              selectedParentRoles !== null &&
                              selectedParentRoles.includes(role.value)
                            }
                          />
                          <ListItemText
                            primary={role.label}
                            secondary={
                              selectedParentRoles?.includes(role.value)
                                ? !menuToEdit
                                  ? "Inherited (Mandatory for sub-menu)"
                                  : "Inherited from parent"
                                : ""
                            }
                          />
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {errors.menuAccessRoles && (
                    <FormHelperText>{errors.menuAccessRoles}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isPending}
              startIcon={isPending ? <CircularProgress size={20} /> : null}
            >
              {isPending
                ? menuToEdit
                  ? "Updating..."
                  : "Creating..."
                : menuToEdit
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <IconPickerDialog
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        onSelect={(iconName) => {
          setFormData((prev) => ({ ...prev, menuIcon: iconName }));
          // Clear error if exists
          if (errors.menuIcon) {
            setErrors((prev) => ({ ...prev, menuIcon: "" }));
          }
        }}
        currentIcon={formData.menuIcon}
      />
    </>
  );
};

export default AddMenusDialog;
