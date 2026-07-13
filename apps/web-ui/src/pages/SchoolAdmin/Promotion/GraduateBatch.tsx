import { useState, useMemo } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
} from "@mui/material";
import TokenService from "../../../queries/token/tokenService";
import { useGetClasses } from "../../../queries/Class";
import { useGetPromotionPreview, useGraduateBatch } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";

const GraduateBatch = () => {
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();

    // States
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");
    const [newAcademicYear, setNewAcademicYear] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    // API Queries
    const { data: classesData, isLoading: classesLoading } = useGetClasses(schoolId);
    const { data: previewData, isLoading: previewLoading } = useGetPromotionPreview(schoolId);
    const graduateMutation = useGraduateBatch(schoolId);

    const classes = classesData?.data || [];
    const students = previewData?.data?.students || [];

    const sections = useMemo(() => {
        const cls = classes.find((c: any) => c.classId === selectedClassId);
        return cls?.sections || [];
    }, [selectedClassId, classes]);

    const filteredStudents = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter((student) => {
            const matchesClass = student.class === selectedClassId;
            const matchesSection = !selectedSectionId || student.section === selectedSectionId;
            return matchesClass && matchesSection;
        });
    }, [selectedClassId, selectedSectionId, students]);

    const handleSelectStudent = (studentId: string) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(filteredStudents.map((s) => s.studentId));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleGraduate = async () => {
        if (selectedStudentIds.length === 0) {
            showNotification("Please select at least one student", "warning");
            return;
        }
        if (!newAcademicYear) {
            showNotification("Please specify the graduating Academic Year", "warning");
            return;
        }

        try {
            await graduateMutation.mutateAsync({
                studentIds: selectedStudentIds,
                newAcademicYear,
                notes,
            });
            showNotification("Selected students graduated successfully!", "success");
            setSelectedStudentIds([]);
            setNewAcademicYear("");
            setNotes("");
        } catch (error: any) {
            showNotification(error.message || "Failed to graduate students", "error");
        }
    };

    if (classesLoading || previewLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
                Graduate Student Batch
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Graduation Settings
                            </Typography>
                            <FormControl fullWidth required>
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={selectedClassId}
                                    label="Class"
                                    onChange={(e) => {
                                        setSelectedClassId(e.target.value);
                                        setSelectedSectionId("");
                                        setSelectedStudentIds([]);
                                    }}
                                >
                                    {classes.map((cls: any) => (
                                        <MenuItem key={cls.classId} value={cls.classId}>
                                            {cls.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Section (Optional)</InputLabel>
                                <Select
                                    value={selectedSectionId}
                                    label="Section (Optional)"
                                    onChange={(e) => {
                                        setSelectedSectionId(e.target.value);
                                        setSelectedStudentIds([]);
                                    }}
                                    disabled={!selectedClassId}
                                >
                                    <MenuItem value="">All Sections</MenuItem>
                                    {sections.map((sec: any) => (
                                        <MenuItem key={sec.sectionId} value={sec.sectionId}>
                                            {sec.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Graduation Year"
                                required
                                placeholder="e.g., 2025-26"
                                value={newAcademicYear}
                                onChange={(e) => setNewAcademicYear(e.target.value)}
                            />

                            <TextField
                                label="Notes / Graduation Ceremony Remarks"
                                multiline
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />

                            <Button
                                variant="contained"
                                color="success"
                                size="large"
                                onClick={handleGraduate}
                                disabled={selectedStudentIds.length === 0 || !newAcademicYear || graduateMutation.isPending}
                            >
                                Graduate Selected Batch
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    {selectedClassId ? (
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Graduation Candidate List ({filteredStudents.length} active students)
                            </Typography>
                            {filteredStudents.length === 0 ? (
                                <Alert severity="info">No active students found in this class/section.</Alert>
                            ) : (
                                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        indeterminate={
                                                            selectedStudentIds.length > 0 &&
                                                            selectedStudentIds.length < filteredStudents.length
                                                        }
                                                        checked={
                                                            filteredStudents.length > 0 &&
                                                            selectedStudentIds.length === filteredStudents.length
                                                        }
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                    />
                                                </TableCell>
                                                <TableCell>Roll No</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Student ID</TableCell>
                                                <TableCell>Current Academic Year</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredStudents.map((student) => (
                                                <TableRow key={student.studentId}>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={selectedStudentIds.includes(student.studentId)}
                                                            onChange={() => handleSelectStudent(student.studentId)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{student.rollNumber || "-"}</TableCell>
                                                    <TableCell>
                                                        {student.firstName} {student.lastName}
                                                    </TableCell>
                                                    <TableCell>{student.studentId}</TableCell>
                                                    <TableCell>{student.academicYear || "-"}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                border: "2px dashed rgba(255,255,255,0.15)",
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "300px",
                            }}
                        >
                            <Typography color="text.secondary">
                                Select a Class to view students and execute graduation
                            </Typography>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default GraduateBatch;
