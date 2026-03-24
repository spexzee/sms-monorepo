import { useState } from "react";
import { Box, IconButton, Tooltip, Chip, Switch } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import DataTable, { StatusChip } from "../../components/Table/DataTable";
import type { Column } from "../../components/Table/DataTable";
import TeacherDialog from "../../components/Dialogs/AddTeacherDialog";
import { useGetTeachers, useUpdateTeacher } from "../../queries/Teacher";
import type { Teacher } from "../../types";
import TokenService from "../../queries/token/tokenService";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../hooks/useNotification";

const TeachersPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Teacher | null>(null);
  const notification = useNotification();

  const schoolId = TokenService.getSchoolId() || "";
  const { page, setPage, limit, setLimit } = useAuth();

  const { data, isLoading, error } = useGetTeachers(schoolId, { page, limit });
  const updateMutation = useUpdateTeacher(schoolId);

  const teachers = data?.data || [];

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditData(teacher);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    const newStatus = teacher.status === "active" ? "inactive" : "active";
    try {
      const result = await updateMutation.mutateAsync({
        teacherId: teacher.teacherId,
        data: { status: newStatus },
      });
      notification.success(result.message || `Teacher status updated to ${newStatus}`);
    } catch (err) {
      notification.error((err as any)?.message || "Failed to update status");
      console.error("Failed to update status:", err);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const columns: Column<Teacher>[] = [
    { id: "teacherId", label: "ID", minWidth: 100 },
    {
      id: "firstName",
      label: "Name",
      minWidth: 150,
      format: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    { id: "email", label: "Email", minWidth: 180 },
    { id: "phone", label: "Phone", minWidth: 120 },
    {
      id: "classTeacherSectionId",
      label: "Class Teacher Of",
      minWidth: 150,
      align: "center",
      format: (_, row) => (
        <Chip
          label={row.classTeacherLabel || "N/A"}
          size="small"
          color={row.classTeacherLabel ? "primary" : "default"}
          variant={row.classTeacherLabel ? "filled" : "outlined"}
        />
      ),
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
      <DataTable<Teacher>
        title="Teachers"
        columns={columns}
        data={teachers}
        isLoading={isLoading}
        error={
          error
            ? (error as { message?: string })?.message ||
              "Failed to load teachers"
            : null
        }
        onAddClick={handleAdd}
        addButtonLabel="Add Teacher"
        emptyMessage="No teachers found. Click 'Add Teacher' to create one."
        getRowKey={(row) => row.teacherId}
        paginationServer
        paginationTotalRows={data?.pagination?.total || 0}
        paginationPerPage={limit}
        onChangePage={(p) => setPage(p)}
        onChangeRowsPerPage={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <TeacherDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schoolId={schoolId}
        editData={editData}
      />
    </Box>
  );
};

export default TeachersPage;
