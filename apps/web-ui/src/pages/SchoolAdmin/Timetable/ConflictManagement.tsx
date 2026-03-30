import { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Chip,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Tooltip,
    LinearProgress,
} from '@mui/material';
import {
    Warning as WarningIcon,
    Person as PersonIcon,
    MeetingRoom as RoomIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import {
    useGetConflictReport,
    useDeleteEntry,
    useUpdateEntry,
    useGetFreeTeachers
} from '../../../queries/Timetable';
import TokenService from '../../../queries/token/tokenService';
import ConfirmationDialog from '../../../components/Dialogs/ConfirmationDialog';

const ConflictManagement = () => {
    const schoolId = TokenService.getSchoolId() || '';

    const { data: conflictData, isLoading, error, refetch, isRefetching } = useGetConflictReport(schoolId);
    const deleteEntryMutation = useDeleteEntry(schoolId);
    const updateEntryMutation = useUpdateEntry(schoolId);

    const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);
    const [newTeacherId, setNewTeacherId] = useState('');
    const [selectedConflictParams, setSelectedConflictParams] = useState({ day: '', period: 0 });

    const { data: freeTeachersData, isLoading: isLoadingFreeTeachers } = useGetFreeTeachers(
        schoolId,
        selectedConflictParams.day,
        selectedConflictParams.period
    );

    const freeTeachers = freeTeachersData?.data || [];

    const handleDeleteEntry = (entryId: string) => {
        setEntryIdToDelete(entryId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!entryIdToDelete) return;
        try {
            await deleteEntryMutation.mutateAsync(entryIdToDelete);
            setDeleteDialogOpen(false);
            setEntryIdToDelete(null);
            refetch();
        } catch (err) {
            console.error('Failed to delete entry:', err);
        }
    };

    const handleCloseDelete = () => {
        setDeleteDialogOpen(false);
        setEntryIdToDelete(null);
    };

    const handleOpenReassign = (entry: any, day: string, period: number) => {
        setSelectedEntry(entry);
        setNewTeacherId(entry.teacherId);
        setSelectedConflictParams({ day, period });
        setReassignDialogOpen(true);
    };

    const handleCloseReassign = () => {
        setReassignDialogOpen(false);
        setSelectedEntry(null);
        setNewTeacherId('');
    };

    const handleConfirmReassign = async () => {
        if (!selectedEntry || !newTeacherId) return;

        try {
            await updateEntryMutation.mutateAsync({
                entryId: selectedEntry.entryId,
                data: { teacherId: newTeacherId }
            });
            handleCloseReassign();
            refetch();
        } catch (err) {
            console.error('Failed to reassign teacher:', err);
        }
    };

    const conflictReport = conflictData?.data;

    // Filter conflicts by type
    const teacherConflicts = useMemo(() => {
        return conflictReport?.conflicts?.filter((c) => c.type === 'teacher') || [];
    }, [conflictReport]);

    const roomConflicts = useMemo(() => {
        return conflictReport?.conflicts?.filter((c) => c.type === 'room') || [];
    }, [conflictReport]);

    const totalConflicts = conflictReport?.totalConflicts || 0;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load conflict report</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, position: 'relative' }}>
            {/* Global Loader during Refetching */}
            {(isRefetching || updateEntryMutation.isPending || deleteEntryMutation.isPending) && (
                <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
                    <LinearProgress color="primary" />
                </Box>
            )}
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={600}>Conflict Management</Typography>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => refetch()}
                    size="small"
                >
                    Refresh
                </Button>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Card sx={{ 
                    minWidth: 200, 
                    bgcolor: totalConflicts === 0 ? 'success.main' : 'error.main',
                    color: 'white'
                }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon sx={{ color: 'white' }} />
                            <Typography variant="h4" fontWeight={600} color="inherit">
                                {totalConflicts}
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                            Total Conflicts
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="primary" />
                            <Typography variant="h4" fontWeight={600}>
                                {teacherConflicts.length}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Teacher Conflicts
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RoomIcon color="secondary" />
                            <Typography variant="h4" fontWeight={600}>
                                {roomConflicts.length}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Room Conflicts
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {totalConflicts === 0 ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                    No scheduling conflicts detected. Your timetable is conflict-free!
                </Alert>
            ) : (
                <>
                    {/* Teacher Conflicts */}
                    {teacherConflicts.length > 0 && (
                        <Paper sx={{ mb: 3, p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon color="primary" />
                                Teacher Double-Booking Conflicts
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell><strong>Description</strong></TableCell>
                                            <TableCell><strong>Timing</strong></TableCell>
                                            <TableCell><strong>Conflicting Assignments</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {teacherConflicts.map((conflict, index) => (
                                            <TableRow 
                                                key={index} 
                                                sx={{ 
                                                    '&:vertical-align': 'top',
                                                    '& td': {
                                                        borderBottom: index < teacherConflicts.length - 1 ? '2px dashed !important' : 'none',
                                                        borderColor: 'grey.400 !important',
                                                        pb: 3,
                                                        pt: 3
                                                    }
                                                }}
                                            >
                                                <TableCell sx={{ minWidth: 200 }}>
                                                    <Typography variant="body2" fontWeight={600} color="error.main">
                                                        {conflict.description}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Resolve this by reassigning or deleting one of the entries below.
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        <Chip
                                                            label={conflict.dayOfWeek?.charAt(0).toUpperCase() + conflict.dayOfWeek?.slice(1)}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        <Chip
                                                            label={`Period ${conflict.periodNumber}`}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Grid container spacing={1}>
                                                        {conflict.entries?.map((entry: any, i: number) => (
                                                            <Grid size={{ xs: 12, md: 6 }} key={i}>
                                                                <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                                                                    <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                        <Box>
                                                                            <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                                                                                {entry.className} - {entry.sectionName}
                                                                            </Typography>
                                                                            <Typography variant="body2" fontWeight={500}>
                                                                                {entry.subjectName}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                Teacher: {entry.teacherName}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex' }}>
                                                                            <Tooltip title="Reassign Teacher">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    color="primary"
                                                                                    onClick={() => handleOpenReassign(entry, conflict.dayOfWeek, conflict.periodNumber)}
                                                                                >
                                                                                    <EditIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                            <Tooltip title="Delete Entry">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    color="error"
                                                                                    onClick={() => handleDeleteEntry(entry.entryId)}
                                                                                >
                                                                                    <DeleteIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    </Box>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* Room Conflicts */}
                    {roomConflicts.length > 0 && (
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RoomIcon color="secondary" />
                                Room Double-Booking Conflicts
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell><strong>Description</strong></TableCell>
                                            <TableCell><strong>Timing</strong></TableCell>
                                            <TableCell><strong>Conflicting Assignments</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {roomConflicts.map((conflict, index) => (
                                            <TableRow 
                                                key={index} 
                                                sx={{ 
                                                    '&:vertical-align': 'top',
                                                    '& td': {
                                                        borderBottom: index < roomConflicts.length - 1 ? '2px dashed !important' : 'none',
                                                        borderColor: 'grey.400 !important',
                                                        pb: 3,
                                                        pt: 3
                                                    }
                                                }}
                                            >
                                                <TableCell sx={{ minWidth: 200 }}>
                                                    <Typography variant="body2" fontWeight={600} color="secondary.main">
                                                        {conflict.description}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Multiple classes are using this room at the same time.
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        <Chip
                                                            label={conflict.dayOfWeek?.charAt(0).toUpperCase() + conflict.dayOfWeek?.slice(1)}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        <Chip
                                                            label={`Period ${conflict.periodNumber}`}
                                                            size="small"
                                                            color="secondary"
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Grid container spacing={1}>
                                                        {conflict.entries?.map((entry: any, i: number) => (
                                                            <Grid size={{ xs: 12, md: 6 }} key={i}>
                                                                <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                                                                    <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                        <Box>
                                                                            <Typography variant="subtitle2" color="secondary.main" fontWeight={700}>
                                                                                {entry.className} - {entry.sectionName}
                                                                            </Typography>
                                                                            <Typography variant="body2" fontWeight={500}>
                                                                                {entry.subjectName}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                Teacher: {entry.teacherName}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Box>
                                                                            <Tooltip title="Delete Entry">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    color="error"
                                                                                    onClick={() => handleDeleteEntry(entry.entryId)}
                                                                                >
                                                                                    <DeleteIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    </Box>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
                </>
            )}

            {/* Reassign Teacher Dialog */}
            <Dialog open={reassignDialogOpen} onClose={handleCloseReassign} maxWidth="xs" fullWidth>
                <DialogTitle>Reassign Teacher</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Class:</strong> {selectedEntry?.className} - {selectedEntry?.sectionName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Subject:</strong> {selectedEntry?.subjectName}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                            Select an available teacher for {selectedConflictParams.day} - Period {selectedConflictParams.period}
                        </Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Free Teacher</InputLabel>
                            <Select
                                value={newTeacherId}
                                label="Select Free Teacher"
                                onChange={(e) => setNewTeacherId(e.target.value)}
                                disabled={isLoadingFreeTeachers}
                            >
                                <MenuItem value=""><em>Select Teacher</em></MenuItem>
                                {freeTeachers.map((t) => (
                                    <MenuItem key={t.teacherId} value={t.teacherId}>
                                        {t.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {freeTeachers.length === 0 && !isLoadingFreeTeachers && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                No other free teachers found for this slot.
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReassign}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmReassign}
                        disabled={!newTeacherId || newTeacherId === selectedEntry?.teacherId || updateEntryMutation.isPending}
                    >
                        {updateEntryMutation.isPending ? 'Updating...' : 'Assign Teacher'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteDialogOpen}
                onClose={handleCloseDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Timetable Entry"
                description="Are you sure you want to delete this timetable entry? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                isLoading={deleteEntryMutation.isPending}
            />

            {/* Info Box */}
            <Alert severity="info" sx={{ mt: 3, '& .MuiAlert-message': { width: '100%' } }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    How to Resolve Conflicts:
                </Typography>
                <Typography variant="body2" component="div">
                    <ul>
                        <li><strong>Reassign:</strong> Click the <EditIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} color="primary" /> icon to move a teacher to a different class or choose an available teacher from the free list.</li>
                        <li><strong>Delete:</strong> Click the <DeleteIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} color="error" /> icon to remove an erroneous entry entirely.</li>
                        <li><strong>Room Conflicts:</strong> These occur when multiple classes are scheduled in the same room. Delete the conflicting entry and assign a different room in the Master Timetable.</li>
                    </ul>
                </Typography>
            </Alert>
        </Box>
    );
};

export default ConflictManagement;
