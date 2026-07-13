import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    FormControlLabel,
    FormGroup,
    TextField,
    Typography,
    CircularProgress,
    Alert,
} from "@mui/material";
import TokenService from "../../../queries/token/tokenService";
import { useArchiveYear } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";

const ArchiveYear = () => {
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();

    const [newAcademicYear, setNewAcademicYear] = useState("");
    const [notes, setNotes] = useState("");

    // Checklist States
    const [checklist, setChecklist] = useState({
        promoted: false,
        repeating: false,
        graduated: false,
        exams: false,
        fees: false,
    });

    const archiveMutation = useArchiveYear(schoolId);

    const handleChecklistChange = (key: keyof typeof checklist) => {
        setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const isChecklistComplete = Object.values(checklist).every((val) => val === true);

    const handleArchive = async () => {
        if (!newAcademicYear) {
            showNotification("Please specify the New Academic Year", "warning");
            return;
        }

        try {
            await archiveMutation.mutateAsync({
                newAcademicYear,
                notes,
            });
            showNotification("Academic year archived and updated successfully!", "success");
            setNewAcademicYear("");
            setNotes("");
            setChecklist({
                promoted: false,
                repeating: false,
                graduated: false,
                exams: false,
                fees: false,
            });
        } catch (error: any) {
            showNotification(error.message || "Failed to archive academic year", "error");
        }
    };

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
                Archive Academic Year
            </Typography>

            <Alert severity="warning" sx={{ mb: 4 }}>
                This is a critical year-end task. Archiving the academic year updates the school's active status configuration to start a new calendar cycle. Please complete the checklist below before performing this operation.
            </Alert>

            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Pre-Archive Checklist
                    </Typography>
                    <FormGroup sx={{ mt: 2, gap: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={checklist.promoted}
                                    onChange={() => handleChecklistChange("promoted")}
                                />
                            }
                            label="I have promoted all passing students from the active classes."
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={checklist.repeating}
                                    onChange={() => handleChecklistChange("repeating")}
                                />
                            }
                            label="I have confirmed and marked all repeating (detained) students."
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={checklist.graduated}
                                    onChange={() => handleChecklistChange("graduated")}
                                />
                            }
                            label="I have marked the outgoing batches as Graduated."
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={checklist.exams}
                                    onChange={() => handleChecklistChange("exams")}
                                />
                            }
                            label="All final-term exam results have been published."
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={checklist.fees}
                                    onChange={() => handleChecklistChange("fees")}
                                />
                            }
                            label="I have audited pending school fees balance logs."
                        />
                    </FormGroup>
                </CardContent>
            </Card>

            <Card>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Academic Transition Parameters
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            label="Next Academic Year to Start"
                            required
                            placeholder="e.g., 2026-27"
                            value={newAcademicYear}
                            onChange={(e) => setNewAcademicYear(e.target.value)}
                            disabled={!isChecklistComplete}
                        />

                        <TextField
                            label="Archive Description / Log Notes"
                            multiline
                            rows={3}
                            placeholder="Provide any description about archiving this year"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={!isChecklistComplete}
                        />

                        <Button
                            variant="contained"
                            color="error"
                            size="large"
                            onClick={handleArchive}
                            disabled={!isChecklistComplete || !newAcademicYear || archiveMutation.isPending}
                        >
                            {archiveMutation.isPending ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                "Close & Archive Academic Year"
                            )}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ArchiveYear;
// Export ArchiveYear component
