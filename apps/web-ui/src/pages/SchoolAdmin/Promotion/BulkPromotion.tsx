import { useState, useEffect } from "react";
import {
    Box,
    Button,
    FormControl,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
} from "@mui/material";
import TokenService from "../../../queries/token/tokenService";
import { useGetClasses } from "../../../queries/Class";
import { useBulkPromote } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";

interface ClassMapping {
    classId: string;
    name: string;
    targetClassId: string;
}

const BulkPromotion = () => {
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();

    const [newAcademicYear, setNewAcademicYear] = useState("");
    const [notes, setNotes] = useState("");
    const [mappings, setMappings] = useState<ClassMapping[]>([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    // Queries & Mutations
    const { data: classesData, isLoading: classesLoading } = useGetClasses(schoolId);
    const bulkPromoteMutation = useBulkPromote(schoolId);

    const classes = classesData?.data || [];

    // Pre-populate mappings with guessed target classes
    useEffect(() => {
        if (classes.length > 0) {
            const initialMappings = classes.map((cls: any) => {
                // Guess target class (e.g. Class 1 -> Class 2)
                const numMatch = cls.name.match(/\d+/);
                let guessedClassId = "";

                if (numMatch) {
                    const currentNum = parseInt(numMatch[0], 10);
                    const nextNum = currentNum + 1;
                    const guessedName = cls.name.replace(numMatch[0], String(nextNum));
                    const foundClass = classes.find(
                        (c: any) => c.name.toLowerCase() === guessedName.toLowerCase()
                    );
                    if (foundClass) {
                        guessedClassId = foundClass.classId;
                    }
                }

                return {
                    classId: cls.classId,
                    name: cls.name,
                    targetClassId: guessedClassId,
                };
            });
            setMappings(initialMappings);
        }
    }, [classesData]);

    const handleMappingChange = (classId: string, targetClassId: string) => {
        setMappings((prev) =>
            prev.map((m) => (m.classId === classId ? { ...m, targetClassId } : m))
        );
    };

    const handleExecuteBulk = async () => {
        const activePromotions = mappings.filter((m) => m.targetClassId !== "");
        if (activePromotions.length === 0) {
            showNotification("Please configure at least one class promotion mapping", "warning");
            return;
        }

        if (!newAcademicYear) {
            showNotification("Please specify the New Academic Year", "warning");
            return;
        }

        try {
            await bulkPromoteMutation.mutateAsync({
                promotions: activePromotions.map((m) => ({
                    classId: m.classId,
                    targetClassId: m.targetClassId,
                })),
                newAcademicYear,
                notes,
            });
            showNotification("Bulk promotion executed successfully!", "success");
            setConfirmDialogOpen(false);
            setNewAcademicYear("");
            setNotes("");
        } catch (error: any) {
            showNotification(error.message || "Failed to execute bulk promotion", "error");
        }
    };

    if (classesLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
                Bulk Class Promotion Mapping
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
                <TextField
                    label="New Academic Year"
                    required
                    placeholder="e.g., 2026-27"
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    sx={{ width: 250 }}
                />
                <TextField
                    label="Notes / Remarks"
                    placeholder="Describe this year-end process"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ flexGrow: 1 }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={!newAcademicYear || bulkPromoteMutation.isPending}
                    onClick={() => setConfirmDialogOpen(true)}
                    sx={{ px: 4 }}
                >
                    Promote All Mapped Classes
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Source Class</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Promotion Action</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Target Class</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mappings.map((mapping) => (
                            <TableRow key={mapping.classId}>
                                <TableCell>{mapping.name}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        Promotes to
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <FormControl sx={{ minWidth: 200 }}>
                                        <InputLabel>Select Target Class</InputLabel>
                                        <Select
                                            value={mapping.targetClassId}
                                            label="Select Target Class"
                                            onChange={(e) =>
                                                handleMappingChange(mapping.classId, e.target.value)
                                            }
                                        >
                                            <MenuItem value="">
                                                <em>Do Not Promote (Stays / Graduates)</em>
                                            </MenuItem>
                                            {classes
                                                .filter((c: any) => c.classId !== mapping.classId)
                                                .map((cls: any) => (
                                                    <MenuItem key={cls.classId} value={cls.classId}>
                                                        {cls.name}
                                                    </MenuItem>
                                                ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Confirm Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
                <DialogTitle>Confirm Year-End Bulk Promotion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You are about to promote all active students in the selected source classes to their designated target classes for the academic year <strong>{newAcademicYear}</strong>.
                        <br />
                        <br />
                        This action will update all matching student records. Are you sure you want to proceed?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setConfirmDialogOpen(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExecuteBulk}
                        variant="contained"
                        color="primary"
                        disabled={bulkPromoteMutation.isPending}
                    >
                        {bulkPromoteMutation.isPending ? "Executing..." : "Confirm & Execute"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BulkPromotion;
// Export BulkPromotion component
