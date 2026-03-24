import { useState } from "react";
import { Box, IconButton, Tooltip, Switch } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import DataTable, { StatusChip } from "../../components/Table/DataTable";
import type { Column } from "../../components/Table/DataTable";
import ParentDialog from "../../components/Dialogs/AddParentDialog";
import { useGetParents, useUpdateParent } from "../../queries/Parent";
import type { Parent } from "../../types";
import TokenService from "../../queries/token/tokenService";
import { useAuth } from "../../context/AuthContext";
import { useNotificationStore } from "../../stores/notificationStore";

const ParentsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Parent | null>(null);
  const { showNotification } = useNotificationStore();

  const schoolId = TokenService.getSchoolId() || "";
  const { page, setPage, limit, setLimit } = useAuth();

  const { data, isLoading, error } = useGetParents(schoolId, { page, limit });
  const updateMutation = useUpdateParent(schoolId);

  const parents = data?.data || [];

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (parent: Parent) => {
    setEditData(parent);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (parent: Parent) => {
    const newStatus = parent.status === "active" ? "inactive" : "active";
    try {
      const result = await updateMutation.mutateAsync({
        parentId: parent.parentId,
        data: { status: newStatus },
      });
      showNotification(result.message || `Parent status updated to ${newStatus}`, "success");
    } catch (err) {
      console.error("Failed to update status:", err);
      showNotification((err as any)?.message || "Failed to update status", "error");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const columns: Column<Parent>[] = [
    { id: "parentId", label: "ID", minWidth: 100 },
    {
      id: "firstName",
      label: "Name",
      minWidth: 150,
      format: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    { id: "email", label: "Email", minWidth: 180 },
    { id: "phone", label: "Phone", minWidth: 120 },
    {
      id: "relationship",
      label: "Relationship",
      minWidth: 100,
      format: (value) =>
        (value as string)?.charAt(0).toUpperCase() +
        (value as string)?.slice(1),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 100,
      align: "center",
      format: (value) => (
        <StatusChip status={(value as "active" | "inactive") || "active"} />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 120,
      align: "center",
      format: (_, row) => (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.status === "active" ? "Deactivate" : "Activate"}>
            <Switch
              size="small"
              checked={row.status === "active"}
              onChange={(e) => {
                e.stopPropagation();
                handleToggleStatus(row);
              }}
              disabled={updateMutation.isPending}
              color="success"
            />
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <DataTable<Parent>
        title="Parents"
        columns={columns}
        data={parents}
        isLoading={isLoading}
        error={
          error
            ? (error as { message?: string })?.message ||
              "Failed to load parents"
            : null
        }
        onAddClick={handleAdd}
        addButtonLabel="Add Parent"
        emptyMessage="No parents found. Click 'Add Parent' to create one."
        getRowKey={(row) => row.parentId}
        paginationServer
        paginationTotalRows={data?.pagination?.total || 0}
        paginationPerPage={limit}
        onChangePage={(p) => setPage(p)}
        onChangeRowsPerPage={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <ParentDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schoolId={schoolId}
        editData={editData}
      />
    </Box>
  );
};

export default ParentsPage;
