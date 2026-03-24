import { useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
} from "@mui/material";
import { Edit as EditIcon, Block as BlockIcon } from "@mui/icons-material";
import DataTable, { StatusChip } from "../../components/Table/DataTable";
import type { Column } from "../../components/Table/DataTable";
import SubjectDialog from "../../components/Dialogs/AddSubjectDialog";
import { useGetSubjects, useUpdateSubject } from "../../queries/Subject";
import { useGetClasses } from "../../queries/Class";
import type { Subject, Class } from "../../types";
import TokenService from "../../queries/token/tokenService";

const SubjectsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Subject | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  const schoolId = TokenService.getSchoolId() || "";

  // Fetch classes for the dropdown
  const { data: classesData } = useGetClasses(schoolId);
  const classes = classesData?.data || [];

  // Filter to get sections of the selected class
  const selectedClassData = classes.find(
    (c: Class) => c.classId === selectedClass,
  );
  const sections = selectedClassData?.sections || [];

  const { data, isLoading, error } = useGetSubjects(schoolId, {
    classId: selectedClass || undefined,
    sectionId: selectedSection || undefined,
  });
  const updateMutation = useUpdateSubject(schoolId);

  const subjects = data?.data || [];

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditData(subject);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (subject: Subject) => {
    const newStatus = subject.status === "active" ? "inactive" : "active";
    try {
      await updateMutation.mutateAsync({
        subjectId: subject.subjectId,
        data: { status: newStatus },
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  const columns: Column<Subject>[] = [
    { id: "subjectId", label: "ID", minWidth: 100 },
    { id: "name", label: "Subject Name", minWidth: 150 },
    {
      id: "code",
      label: "Code",
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value as string}
          size="small"
          color="secondary"
          variant="outlined"
        />
      ),
    },
    {
      id: "assignedTeacherName",
      label: "Assigned Teacher",
      minWidth: 150,
      format: (value) => (
        <Chip
          label={(value as string) || "Not Assigned"}
          size="small"
          color={value ? "primary" : "default"}
          variant={value ? "filled" : "outlined"}
        />
      ),
    },
    { id: "description", label: "Description", minWidth: 200 },
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
            <IconButton
              size="small"
              color={row.status === "active" ? "error" : "success"}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(row);
              }}
              disabled={updateMutation.isPending}
            >
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                label="Class"
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection("");
                }}
              >
                <MenuItem value="">All Classes</MenuItem>
                {classes.map((c: Class) => (
                  <MenuItem key={c.classId} value={c.classId}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small" disabled={!selectedClass}>
              <InputLabel>Section</InputLabel>
              <Select
                value={selectedSection}
                label="Section"
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <MenuItem value="">All Sections</MenuItem>
                {sections.map((s) => (
                  <MenuItem key={s.sectionId} value={s.sectionId}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <DataTable<Subject>
        title="Subjects"
        columns={columns}
        data={subjects}
        isLoading={isLoading}
        error={
          error
            ? (error as { message?: string })?.message ||
              "Failed to load subjects"
            : null
        }
        onAddClick={handleAdd}
        addButtonLabel="Add Subject"
        emptyMessage="No subjects found. Click 'Add Subject' to create one."
        getRowKey={(row) => row.subjectId}
      />

      <SubjectDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schoolId={schoolId}
        editData={editData}
        initialClassId={selectedClass}
        initialSectionId={selectedSection}
      />
    </Box>
  );
};

export default SubjectsPage;
