import { useState, useMemo } from 'react';
import { Box, IconButton, Tooltip, Switch } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import StudentDialog from '../../components/Dialogs/AddStudentDialog';
import ExcelBulkActions from '../../components/ExcelBulk/ExcelBulkActions';
import { useGetStudents, useUpdateStudent, useBulkCreateStudents } from '../../queries/Student';
import { useGetClasses } from '../../queries/Class';
import type { Student, CreateStudentPayload } from '../../types';
import type { TemplateConfig, ParseConfig } from '../../utils/excelBulk';
import TokenService from '../../queries/token/tokenService';
import { useAuth } from '../../context/AuthContext';
import { useNotificationStore } from '../../stores/notificationStore';

// Student Excel template column definitions
const STUDENT_TEMPLATE_COLUMNS = [
  { key: 'firstName', header: 'firstName', width: 18 },
  { key: 'lastName', header: 'lastName', width: 18 },
  { key: 'email', header: 'email', width: 25, note: 'Optional. Must be unique across the system.' },
  { key: 'password', header: 'password', width: 15, note: 'Required. Will be used for student login.' },
  { key: 'phone', header: 'phone', width: 15 },
  { key: 'class', header: 'class', width: 12, note: 'Enter Class Name or ID. Required.' },
  { key: 'section', header: 'section', width: 12, note: 'Enter Section Name or ID.' },
  { key: 'rollNumber', header: 'rollNumber', width: 12 },
  { key: 'parentId', header: 'parentId', width: 15, note: 'Enter Parent ID, Phone, or Email to link. Optional.' },
  { key: 'dateOfBirth', header: 'dateOfBirth', width: 15, note: 'Format: YYYY-MM-DD' },
  {
    key: 'gender',
    header: 'gender',
    width: 12,
    validation: { type: 'list' as const, options: ['male', 'female', 'other'] },
  },
  { key: 'address', header: 'address', width: 30 },
  {
    key: 'status',
    header: 'status',
    width: 12,
    validation: { type: 'list' as const, options: ['active', 'inactive'] },
  },
];

const StudentsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Student | null>(null);

  const schoolId = TokenService.getSchoolId() || "";
  const { page, setPage, limit, setLimit } = useAuth();
  const { showNotification } = useNotificationStore();

  const { data, isLoading, error } = useGetStudents(schoolId, { page, limit });
  const updateMutation = useUpdateStudent(schoolId);
  const bulkCreateMutation = useBulkCreateStudents(schoolId);

  // Fetch classes for reference in notes
  const { data: classesData } = useGetClasses(schoolId);

  const students = data?.data || [];

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditData(student);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (student: Student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      const result = await updateMutation.mutateAsync({
        studentId: student.studentId,
        data: { status: newStatus },
      });
      showNotification(result.message || `Student status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showNotification((err as any)?.message || 'Failed to update status', 'error');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  // Build the template config with class note dynamically
  const templateConfig: TemplateConfig = useMemo(() => {
    const classes = classesData?.data || [];
    const classNote =
      classes.length > 0
        ? `Class Name or ID (required). Available: ${classes.map((c: any) => c.name).join(', ')}`
        : 'Enter Class Name or ID (e.g., "10"). Required.';

    const columns = STUDENT_TEMPLATE_COLUMNS.map((col) => {
      if (col.key === 'class') {
        return { ...col, note: classNote };
      }
      return col;
    });

    return {
      sheetName: 'Students',
      fileName: 'Student_Bulk_Upload_Template',
      columns,
    };
  }, [classesData]);

  const parseConfig: ParseConfig = useMemo(
    () => ({
      expectedColumns: STUDENT_TEMPLATE_COLUMNS.map((c) => c.header),
    }),
    []
  );

  const handleBulkUpload = async (parsedData: any[]) => {
    try {
      const result = await bulkCreateMutation.mutateAsync(
        parsedData as Partial<CreateStudentPayload>[]
      );

      const { inserted, failed, errors } = (result as any).data || {};

      if (failed > 0 && errors?.length > 0) {
        const errorSummary = errors
          .slice(0, 5)
          .map((e: any) => `Row ${e.row}: ${e.message}`)
          .join('\n');
        const moreText = errors.length > 5 ? `\n...and ${errors.length - 5} more errors` : '';
        showNotification(
          `Inserted ${inserted}, Failed ${failed}. Errors:\n${errorSummary}${moreText}`,
          failed === parsedData.length ? 'error' : 'warning'
        );
      } else {
        showNotification(`Successfully imported ${inserted} student(s)!`, 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Bulk upload failed', 'error');
    }
  };

  const columns: Column<Student>[] = [
    { id: 'studentId', label: 'ID', minWidth: 100 },
    {
      id: 'firstName',
      label: 'Name',
      minWidth: 150,
      format: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      id: 'class',
      label: 'Class',
      minWidth: 80,
      format: (value, row) => row.className || value || '-',
    },
    {
      id: 'section',
      label: 'Section',
      minWidth: 80,
      format: (value, row) => row.sectionName || value || '-',
    },
    { id: 'rollNumber', label: 'Roll No', minWidth: 80 },
    {
      id: 'parentName',
      label: 'Parent',
      minWidth: 120,
      format: (value, row) => value || (row.parentId ? 'Unknown' : 'Not Linked'),
    },
    { id: 'phone', label: 'Phone', minWidth: 120 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      align: 'center',
      format: (value) => <StatusChip status={(value as 'active' | 'inactive') || 'active'} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'center',
      format: (_, row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Switch
              size="small"
              checked={row.status === 'active'}
              onChange={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
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
      {/* Bulk Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <ExcelBulkActions
          templateConfig={templateConfig}
          parseConfig={parseConfig}
          onUploadComplete={handleBulkUpload}
          downloadButtonText="Download Template"
          uploadButtonText="Upload Students"
          disabled={bulkCreateMutation.isPending}
        />
      </Box>

      <DataTable<Student>
        title="Students"
        columns={columns}
        data={students}
        isLoading={isLoading}
        error={error ? (error as { message?: string })?.message || 'Failed to load students' : null}
        onAddClick={handleAdd}
        addButtonLabel="Add Student"
        emptyMessage="No students found. Click 'Add Student' to create one."
        getRowKey={(row) => row.studentId}
        paginationServer
        paginationTotalRows={data?.pagination?.total || 0}
        paginationPerPage={limit}
        onChangePage={(p) => setPage(p)}
        onChangeRowsPerPage={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <StudentDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        schoolId={schoolId}
        editData={editData}
      />
    </Box>
  );
};

export default StudentsPage;
