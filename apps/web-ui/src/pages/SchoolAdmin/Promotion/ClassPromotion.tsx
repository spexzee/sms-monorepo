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
import { useGetPromotionPreview, usePromoteClass } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";

const ClassPromotion = () => {
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();

    // Form states
    const [sourceClassId, setSourceClassId] = useState("");
    const [sourceSectionId, setSourceSectionId] = useState("");
    const [targetClassId, setTargetClassId] = useState("");
    const [targetSectionId, setTargetSectionId] = useState("");
    const [newAcademicYear, setNewAcademicYear] = useState("");
    const [notes, setNotes] = useState("");

    // Student list modifiers
    const [repeaters, setRepeaters] = useState<string[]>([]);
    const [graduates, setGraduates] = useState<string[]>([]);

    // API Hooks
    const { data: classesData, isLoading: classesLoading } = useGetClasses(schoolId);
    const { data: previewData, isLoading: previewLoading } = useGetPromotionPreview(schoolId);
    const promoteMutation = usePromoteClass(schoolId);

    const classes = classesData?.data || [];
    const students = previewData?.data?.students || [];

    // Filter sections for selected classes
    const sourceSections = useMemo(() => {
        const cls = classes.find((c: any) => c.classId === sourceClassId);
        return cls?.sections || [];
    }, [sourceClassId, classes]);

    const targetSections = useMemo(() => {
        const cls = classes.find((c: any) => c.classId === targetClassId);
        return cls?.sections || [];
    }, [targetClassId, classes]);

    // Filter students belonging to selected class/section
    const filteredStudents = useMemo(() => {
        if (!sourceClassId) return [];
        return students.filter((student) => {
            const matchesClass = student.class === sourceClassId;
            const matchesSection = !sourceSectionId || student.section === sourceSectionId;
            return matchesClass && matchesSection;
        });
    }, [sourceClassId, sourceSectionId, students]);

    const handleRepeaterToggle = (studentId: string) => {
        setRepeaters((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev.filter((id) => !graduates.includes(id)), studentId] // disable graduation if repeating
        );
        // remove from graduates if checked as repeater
        setGraduates((prev) => prev.filter((id) => id !== studentId));
    };

    const handleGraduateToggle = (studentId: string) => {
        setGraduates((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev.filter((id) => !repeaters.includes(id)), studentId] // disable repeat if graduating
        );
        // remove from repeaters if checked as graduate
        setRepeaters((prev) => prev.filter((id) => id !== studentId));
    };

    const handlePromote = async () => {
        if (!sourceClassId || !targetClassId || !newAcademicYear) {
            showNotification("Please fill in all required fields", "warning");
            return;
        }

        try {
            await promoteMutation.mutateAsync({
                classId: sourceClassId,
                sectionId: sourceSectionId || undefined,
                targetClassId,
                targetSectionId: targetSectionId || undefined,
                newAcademicYear,
                repeaters,
                graduates,
                notes,
            });
            showNotification("Class promoted successfully!", "success");
            // Clear selections
            setSourceClassId("");
            setSourceSectionId("");
            setTargetClassId("");
            setTargetSectionId("");
            setNewAcademicYear("");
            setNotes("");
            setRepeaters([]);
            setGraduates([]);
        } catch (error: any) {
            showNotification(error.message || "Failed to promote class", "error");
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
                Promote Single Class
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Promotion Parameters
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Source Class</InputLabel>
                                    <Select
                                        value={sourceClassId}
                                        label="Source Class"
                                        onChange={(e) => {
                                            setSourceClassId(e.target.value);
                                            setSourceSectionId("");
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
                                    <InputLabel>Source Section (Optional)</InputLabel>
                                    <Select
                                        value={sourceSectionId}
                                        label="Source Section (Optional)"
                                        onChange={(e) => setSourceSectionId(e.target.value)}
                                        disabled={!sourceClassId}
                                    >
                                        <MenuItem value="">All Sections</MenuItem>
                                        {sourceSections.map((sec: any) => (
                                            <MenuItem key={sec.sectionId} value={sec.sectionId}>
                                                {sec.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth required>
                                    <InputLabel>Target Class</InputLabel>
                                    <Select
                                        value={targetClassId}
                                        label="Target Class"
                                        onChange={(e) => {
                                            setTargetClassId(e.target.value);
                                            setTargetSectionId("");
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
                                    <InputLabel>Target Section (Optional)</InputLabel>
                                    <Select
                                        value={targetSectionId}
                                        label="Target Section (Optional)"
                                        onChange={(e) => setTargetSectionId(e.target.value)}
                                        disabled={!targetClassId}
                                    >
                                        <MenuItem value="">Maintain Current Sections</MenuItem>
                                        {targetSections.map((sec: any) => (
                                            <MenuItem key={sec.sectionId} value={sec.sectionId}>
                                                {sec.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="New Academic Year"
                                    required
                                    placeholder="e.g., 2026-27"
                                    value={newAcademicYear}
                                    onChange={(e) => setNewAcademicYear(e.target.value)}
                                />

                                <TextField
                                    label="Notes / Remarks"
                                    multiline
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />

                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    fullWidth
                                    onClick={handlePromote}
                                    disabled={!sourceClassId || !targetClassId || !newAcademicYear || promoteMutation.isPending}
                                    sx={{ mt: 1 }}
                                >
                                    {promoteMutation.isPending ? <CircularProgress size={24} /> : "Execute Promotion"}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    {sourceClassId ? (
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                                Student List ({filteredStudents.length} active students)
                            </Typography>
                            {filteredStudents.length === 0 ? (
                                <Alert severity="info">No active students found in this class/section.</Alert>
                            ) : (
                                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Roll No</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Student ID</TableCell>
                                                <TableCell align="center">Repeat (Stay in Class)</TableCell>
                                                <TableCell align="center">Graduate (Archive)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredStudents.map((student) => (
                                                <TableRow key={student.studentId}>
                                                    <TableCell>{student.rollNumber || "-"}</TableCell>
                                                    <TableCell>
                                                        {student.firstName} {student.lastName}
                                                    </TableCell>
                                                    <TableCell>{student.studentId}</TableCell>
                                                    <TableCell align="center">
                                                        <Checkbox
                                                            checked={repeaters.includes(student.studentId)}
                                                            onChange={() => handleRepeaterToggle(student.studentId)}
                                                            color="warning"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Checkbox
                                                            checked={graduates.includes(student.studentId)}
                                                            onChange={() => handleGraduateToggle(student.studentId)}
                                                            color="success"
                                                        />
                                                    </TableCell>
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
                                Select a Source Class to preview and customize student promotions
                            </Typography>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ClassPromotion;
