import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Card,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Chip,
    Box,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
} from '@mui/material';
import { MuiIcons } from '../../../utils/Icons';
import { useAuth } from '../../../context/AuthContext';
import {
    useGetExams,
    useGetExamSchedule,
    useGetSubjectResults,
    useSubmitMarks
} from '../../../queries/Exam';
import { useGetStudents } from '../../../queries/Student';
import { useGetTeacherById } from '../../../queries/Teacher';
import { useGetSubjects } from '../../../queries/Subject';

import type { SubmitMarksRequest } from '../../../types/exam.types';

// ─── Toast Helper ──────────────────────────────────────────────────────────────
type ToastSeverity = 'success' | 'error' | 'warning' | 'info';
interface ToastState { open: boolean; message: string; severity: ToastSeverity; }

// ─── Numeric Input Helper ──────────────────────────────────────────────────────
const toNumericString = (value: string): string => value.replace(/[^0-9.]/g, '');

const MarksEntry = () => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const teacherId = user?.userId || '';

    // ── Selection States ──────────────────────────────────────────────────────
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState('');

    // Ref to track when submit is driven by "Save & Switch" so onSuccess can apply the switch
    const pendingSwitchRef = useRef<{ examId: string | null; scheduleId: string | null } | null>(null);

    // ── Pending selection (used while confirming unsaved changes) ─────────────
    const [pendingExamId, setPendingExamId] = useState<string | null>(null);
    const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(null);
    const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);

    // ── Apply a pending switch (called from confirmDiscard or onSuccess) ──────
    const applyPendingSwitch = useCallback((pendingExam: string | null, pendingSchedule: string | null) => {
        if (pendingExam !== null) {
            setSelectedExamId(pendingExam);
            setSelectedScheduleId(pendingSchedule ?? '');
        } else if (pendingSchedule !== null) {
            setSelectedScheduleId(pendingSchedule);
        }
        setPendingExamId(null);
        setPendingScheduleId(null);
        setHasChanges(false);
        setErrors({});
    }, []);

    // ── Toast State ───────────────────────────────────────────────────────────
    const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });
    const showToast = useCallback((message: string, severity: ToastSeverity = 'success') => {
        setToast({ open: true, message, severity });
    }, []);

    // ── Data Fetching ─────────────────────────────────────────────────────────
    const { data: exams } = useGetExams(schoolId);
    const { data: scheduleData } = useGetExamSchedule(schoolId, selectedExamId);
    const { data: teacherData } = useGetTeacherById(schoolId, teacherId);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const { data: resultsData } = useGetSubjectResults(schoolId, selectedExamId, selectedScheduleId);

    // ── Teacher's assigned subjects ───────────────────────────────────────────
    const teacherSubjects = teacherData?.data?.subjects || [];

    // ── Filter schedules — handle both subjectId and _id formats ─────────────
    const allSubjects = subjectsData?.data || [];
    const filteredSchedules = scheduleData?.data?.filter((s: any) => {
        if (teacherSubjects.includes(s.subjectId)) return true;
        const subjectByMongoId = allSubjects.find((sub: any) => sub._id === s.subjectId);
        if (subjectByMongoId && teacherSubjects.includes(subjectByMongoId.subjectId)) return true;
        return false;
    }) || [];

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getSubjectName = (subjectId: string): string => {
        const subject = subjectsData?.data?.find((s: any) => s._id === subjectId || s.subjectId === subjectId);
        return subject?.name || subjectId;
    };

    // ── Auto-select if only one subject available ─────────────────────────────
    useEffect(() => {
        if (filteredSchedules.length === 1 && !selectedScheduleId) {
            setSelectedScheduleId(filteredSchedules[0]._id);
        }
    }, [filteredSchedules, selectedScheduleId]);

    // ── Derived Data ──────────────────────────────────────────────────────────
    const selectedSchedule = filteredSchedules.find((s: any) => s._id === selectedScheduleId);

    // ── Students for selected class ───────────────────────────────────────────
    const { data: studentsData } = useGetStudents(schoolId, {
        class: selectedSchedule?.classId,
    });

    const submitMarks = useSubmitMarks(schoolId);

    // ── Marks Grid State ──────────────────────────────────────────────────────
    const [marksGrid, setMarksGrid] = useState<any[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    // Track per-field validation errors: { [rowIndex]: { theory?: string; practical?: string } }
    const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

    // ── Initialize Grid when Data Changes ────────────────────────────────────
    useEffect(() => {
        if (studentsData?.data && selectedSchedule) {
            const grid = studentsData.data.map((student: any) => {
                const result = resultsData?.data?.find((r: any) => r.studentId === student.studentId);
                return {
                    studentId: student.studentId,
                    name: `${student.firstName} ${student.lastName}`,
                    rollNumber: student.rollNumber,
                    theory: result?.marksObtainedTheory ?? '',
                    practical: result?.marksObtainedPractical ?? '',
                    remarks: result?.remarks || '',
                    attendanceStatus: result?.attendanceStatus || 'present',
                    maxTheory: selectedSchedule.maxMarksTheory,
                    maxPractical: selectedSchedule.maxMarksPractical
                };
            });
            setMarksGrid(grid);
            setHasChanges(false);
            setErrors({});
        }
    }, [studentsData, resultsData, selectedSchedule]);

    // ── Handle changing exam with unsaved-changes guard ───────────────────────
    const handleExamChange = (newExamId: string) => {
        if (hasChanges) {
            setPendingExamId(newExamId);
            setPendingScheduleId('');
            setUnsavedDialogOpen(true);
        } else {
            setSelectedExamId(newExamId);
            setSelectedScheduleId('');
        }
    };

    // ── Handle changing subject/schedule with unsaved-changes guard ───────────
    const handleScheduleChange = (newScheduleId: string) => {
        if (hasChanges) {
            setPendingScheduleId(newScheduleId);
            setPendingExamId(null);
            setUnsavedDialogOpen(true);
        } else {
            setSelectedScheduleId(newScheduleId);
        }
    };

    // ── Confirm discard unsaved changes ───────────────────────────────────────
    const confirmDiscard = () => {
        setUnsavedDialogOpen(false);
        applyPendingSwitch(pendingExamId, pendingScheduleId);
    };

    // ── Handle marks input — numbers only ─────────────────────────────────────
    const handleMarkChange = (index: number, field: string, rawValue: string) => {
        const newGrid = [...marksGrid];

        if (field === 'theory' || field === 'practical') {
            const numericValue = toNumericString(rawValue);
            newGrid[index][field] = numericValue;

            // Validate
            const numVal = parseFloat(numericValue);
            const max = field === 'theory' ? newGrid[index].maxTheory : newGrid[index].maxPractical;
            const newErrors = { ...errors };
            if (!newErrors[index]) newErrors[index] = {};

            if (numericValue !== '' && isNaN(numVal)) {
                newErrors[index][field] = 'Must be a number';
            } else if (numericValue !== '' && numVal < 0) {
                newErrors[index][field] = 'Cannot be negative';
            } else if (numericValue !== '' && max > 0 && numVal > max) {
                newErrors[index][field] = `Max is ${max}`;
            } else {
                delete newErrors[index][field];
            }
            setErrors(newErrors);
        } else {
            newGrid[index][field] = rawValue;
        }

        setMarksGrid(newGrid);
        setHasChanges(true);
    };

    // ── Validate before submit ────────────────────────────────────────────────
    const validateAll = (): boolean => {
        const newErrors: Record<number, Record<string, string>> = {};
        let valid = true;
        marksGrid.forEach((row, index) => {
            if (row.attendanceStatus !== 'present') return;
            if (row.theory === '' || row.theory === null || row.theory === undefined) {
                if (!newErrors[index]) newErrors[index] = {};
                newErrors[index]['theory'] = 'Required';
                valid = false;
            } else {
                const t = parseFloat(row.theory);
                if (isNaN(t) || t < 0) {
                    if (!newErrors[index]) newErrors[index] = {};
                    newErrors[index]['theory'] = 'Invalid';
                    valid = false;
                } else if (row.maxTheory > 0 && t > row.maxTheory) {
                    if (!newErrors[index]) newErrors[index] = {};
                    newErrors[index]['theory'] = `Max ${row.maxTheory}`;
                    valid = false;
                }
            }
            if (row.maxPractical > 0) {
                const p = parseFloat(row.practical);
                if (row.practical !== '' && (isNaN(p) || p < 0 || p > row.maxPractical)) {
                    if (!newErrors[index]) newErrors[index] = {};
                    newErrors[index]['practical'] = `Max ${row.maxPractical}`;
                    valid = false;
                }
            }
        });
        setErrors(newErrors);
        return valid;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        if (!selectedSchedule) return;
        if (!validateAll()) {
            showToast('Please fix the validation errors before saving.', 'error');
            return;
        }

        const payload: SubmitMarksRequest = {
            examId: selectedExamId,
            scheduleId: selectedScheduleId,
            marks: marksGrid.map(row => ({
                studentId: row.studentId,
                theory: row.attendanceStatus === 'present' ? (parseFloat(row.theory) || 0) : 0,
                practical: row.attendanceStatus === 'present' ? (parseFloat(row.practical) || 0) : 0,
                remarks: row.remarks,
                attendanceStatus: row.attendanceStatus
            }))
        };

        // Capture the pending switch info from the ref before the async call
        const switchTarget = pendingSwitchRef.current;
        pendingSwitchRef.current = null;

        submitMarks.mutate(payload, {
            onSuccess: (data: any) => {
                if (data.errors && data.errors.length > 0) {
                    showToast(`Saved with internal issues: ${data.errors.slice(0, 2).join(', ')}${data.errors.length > 2 ? '...' : ''}`, 'warning');
                } else {
                    showToast('Marks submitted successfully!', 'success');
                }
                
                setHasChanges(false);
                // NOTE: useSubmitMarks already calls queryClient.invalidateQueries({ queryKey: [RESULTS] })
                if (switchTarget) {
                    applyPendingSwitch(switchTarget.examId, switchTarget.scheduleId);
                }
            },
            onError: (err: any) => {
                showToast(`Failed to submit marks: ${err?.message || 'Unknown error'}`, 'error');
            }
        });
    };

    // ── Check if a field has error ────────────────────────────────────────────
    const getFieldError = (index: number, field: string) => errors[index]?.[field];

    return (
        <Box sx={{ p: 3 }}>
            {/* ── Page Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={600}>Details Entry (Marks)</Typography>
                {hasChanges && (
                    <Chip
                        label="Unsaved changes"
                        color="warning"
                        size="small"
                        icon={<MuiIcons.Warning fontSize="small" />}
                    />
                )}
            </Box>

            {/* ── Exam / Subject Selection Card ── */}
            <Card sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: teacherSubjects.length <= 1 ? '1fr' : '1fr 1fr', gap: 2 }}>
                    {/* Exam Select */}
                    <FormControl fullWidth>
                        <InputLabel>Select Exam</InputLabel>
                        <Select
                            value={selectedExamId}
                            label="Select Exam"
                            onChange={(e) => handleExamChange(e.target.value)}
                        >
                            {exams?.data?.map((e: any) => (
                                <MenuItem key={e._id} value={e.examId}>{e.name} ({e.status})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Subject / Schedule Select — only shown if teacher has multiple subjects */}
                    {teacherSubjects.length > 1 && (
                        <FormControl fullWidth disabled={!selectedExamId || filteredSchedules.length === 0}>
                            <InputLabel>Select Subject/Class</InputLabel>
                            <Select
                                value={selectedScheduleId}
                                label="Select Subject/Class"
                                onChange={(e) => handleScheduleChange(e.target.value)}
                            >
                                {filteredSchedules.map((s: any) => (
                                    <MenuItem key={s._id} value={s._id}>
                                        {getSubjectName(s.subjectId)} - Class {s.classId} ({new Date(s.date).toLocaleDateString()})
                                    </MenuItem>
                                ))}
                                {filteredSchedules.length === 0 && <MenuItem disabled>No schedules for your subjects</MenuItem>}
                            </Select>
                        </FormControl>
                    )}

                    {/* Single-subject info banner */}
                    {teacherSubjects.length === 1 && filteredSchedules.length === 1 && selectedSchedule && (
                        <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <Typography variant="body1">
                                <strong>Subject:</strong> {getSubjectName(selectedSchedule.subjectId)} — Class {selectedSchedule.classId}
                            </Typography>
                        </Paper>
                    )}
                </Box>

                {/* No schedules warning */}
                {selectedExamId && filteredSchedules.length === 0 && (
                    <Paper sx={{ p: 3, mt: 2, bgcolor: 'warning.light', textAlign: 'center', color: "#fff" }}>
                        <Typography variant="body1" color="red" fontWeight={600}>
                            No exam schedules found for your assigned subjects
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This exam may not have been scheduled yet, or you may not be assigned to teach any subjects for this exam.
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Your assigned subjects: {teacherSubjects.length > 0 ? teacherSubjects.map(getSubjectName).join(', ') : 'None'}
                        </Typography>
                    </Paper>
                )}
            </Card>

            {/* ── Marks Grid ── */}
            {selectedScheduleId && (
                <Card sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                            <Typography variant="h6">Enter Marks</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                    size="small"
                                    label={`Theory: ${selectedSchedule?.maxMarksTheory ?? 0} marks`}
                                    color="primary"
                                    variant="outlined"
                                />
                                <Chip
                                    size="small"
                                    label={`Practical: ${selectedSchedule?.maxMarksPractical ?? 0} marks`}
                                    color="secondary"
                                    variant={(selectedSchedule?.maxMarksPractical ?? 0) > 0 ? 'filled' : 'outlined'}
                                />
                                <Chip
                                    size="small"
                                    label={`Passing: ${selectedSchedule?.passingMarks ?? 0}`}
                                    color="success"
                                    variant="outlined"
                                />
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<MuiIcons.Save />}
                            onClick={handleSubmit}
                            disabled={!hasChanges || submitMarks.isPending}
                            sx={{ minWidth: 140 }}
                        >
                            {submitMarks.isPending ? 'Saving...' : 'Save Marks'}
                        </Button>
                    </Box>

                    <TableContainer component={Paper} elevation={0} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Roll No</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Attendance</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        Theory
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Max: {selectedSchedule?.maxMarksTheory ?? 0}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        Practical
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Max: {selectedSchedule?.maxMarksPractical ?? 0}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {marksGrid.map((row, index) => {
                                    const isAbsent = row.attendanceStatus !== 'present';
                                    return (
                                        <TableRow key={row.studentId} hover sx={{ opacity: isAbsent ? 0.6 : 1 }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>{row.rollNumber}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{row.name}</Typography>
                                            </TableCell>

                                            {/* Attendance */}
                                            <TableCell>
                                                <Select
                                                    size="small"
                                                    value={row.attendanceStatus}
                                                    onChange={(e) => handleMarkChange(index, 'attendanceStatus', e.target.value)}
                                                    variant="standard"
                                                    sx={{ minWidth: 100 }}
                                                >
                                                    <MenuItem value="present">Present</MenuItem>
                                                    <MenuItem value="absent">Absent</MenuItem>
                                                    <MenuItem value="medical_leave">Medical</MenuItem>
                                                </Select>
                                            </TableCell>

                                            {/* Theory */}
                                            <TableCell>
                                                <Tooltip
                                                    title={getFieldError(index, 'theory') || ''}
                                                    open={!!getFieldError(index, 'theory')}
                                                    placement="top"
                                                    arrow
                                                >
                                                    <TextField
                                                        type="text"
                                                        inputMode="numeric"
                                                        size="small"
                                                        value={isAbsent ? '—' : row.theory}
                                                        onChange={(e) => handleMarkChange(index, 'theory', e.target.value)}
                                                        disabled={isAbsent}
                                                        error={!!getFieldError(index, 'theory')}
                                                        placeholder={`0–${row.maxTheory}`}
                                                        sx={{ width: 90 }}
                                                        inputProps={{
                                                            inputMode: 'numeric',
                                                            pattern: '[0-9]*',
                                                            style: { textAlign: 'center' }
                                                        }}
                                                    />
                                                </Tooltip>
                                            </TableCell>

                                            {/* Practical */}
                                            <TableCell>
                                                <Tooltip
                                                    title={
                                                        getFieldError(index, 'practical') ||
                                                        (row.maxPractical === 0 ? 'Set max practical marks in the exam schedule to enable' : '')
                                                    }
                                                    placement="top"
                                                    arrow
                                                >
                                                    <span>
                                                        <TextField
                                                            type="text"
                                                            inputMode="numeric"
                                                            size="small"
                                                            value={isAbsent ? '—' : row.practical}
                                                            onChange={(e) => handleMarkChange(index, 'practical', e.target.value)}
                                                            disabled={isAbsent || row.maxPractical === 0}
                                                            error={!!getFieldError(index, 'practical')}
                                                            placeholder={row.maxPractical > 0 ? `0–${row.maxPractical}` : 'N/A'}
                                                            sx={{ width: 90, opacity: row.maxPractical === 0 ? 0.5 : 1 }}
                                                            inputProps={{
                                                                inputMode: 'numeric',
                                                                pattern: '[0-9]*',
                                                                style: { textAlign: 'center' }
                                                            }}
                                                        />
                                                    </span>
                                                </Tooltip>
                                            </TableCell>

                                            {/* Remarks */}
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    value={row.remarks}
                                                    onChange={(e) => handleMarkChange(index, 'remarks', e.target.value)}
                                                    placeholder="Optional"
                                                    disabled={isAbsent}
                                                    sx={{ width: 140 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {marksGrid.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            No students found for this class.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            {/* ── Unsaved Changes Confirmation Dialog ── */}
            <Dialog open={unsavedDialogOpen} onClose={() => setUnsavedDialogOpen(false)} maxWidth="xs">
                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MuiIcons.Warning color="warning" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={600}>Unsaved Changes</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    <DialogContentText variant="body2">
                        You have unsaved marks. Switching now will lose your changes.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
                    <Button size="small" variant="text" onClick={() => setUnsavedDialogOpen(false)} sx={{ color: 'text.secondary' }}>
                        Stay
                    </Button>
                    <Button size="small" variant="text" color="error" onClick={confirmDiscard}>
                        Discard
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        startIcon={<MuiIcons.Save fontSize="inherit" />}
                        onClick={() => {
                            // Store the pending target in a ref so onSuccess can apply the switch
                            pendingSwitchRef.current = {
                                examId: pendingExamId,
                                scheduleId: pendingScheduleId
                            };
                            setUnsavedDialogOpen(false);
                            handleSubmit();
                        }}
                    >
                        Save &amp; Switch
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Toast Notification ── */}
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setToast(prev => ({ ...prev, open: false }))}
                    severity={toast.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MarksEntry;
