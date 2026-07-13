import { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";
import TokenService from "../../../queries/token/tokenService";
import { useGetPromotionLogs, useRollbackPromotion } from "../../../queries/Promotion";
import { useNotificationStore } from "../../../stores/notificationStore";
import DataTable from "../../../components/Table/DataTable";
import type { Column } from "../../../components/Table/DataTable";
import ConfirmationDialog from "../../../components/Dialogs/ConfirmationDialog";

const PromotionLogs = () => {
    const schoolId = TokenService.getSchoolId() || "";
    const { showNotification } = useNotificationStore();

    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
    const [rollbackLogId, setRollbackLogId] = useState<string | null>(null);

    // Queries
    const { data: logsData, isLoading, error } = useGetPromotionLogs(schoolId);
    const rollbackMutation = useRollbackPromotion(schoolId);

    const logs = logsData?.data || [];

    const handleRollbackClick = (logId: string) => {
        setRollbackLogId(logId);
        setRollbackDialogOpen(true);
    };

    const handleExecuteRollback = async () => {
        if (!rollbackLogId) return;

        try {
            await rollbackMutation.mutateAsync(rollbackLogId);
            showNotification("Promotion rolled back successfully!", "success");
        } catch (error: any) {
            showNotification(error.message || "Failed to rollback promotion", "error");
        } finally {
            setRollbackDialogOpen(false);
            setRollbackLogId(null);
        }
    };

    const handleViewDetails = (log: any) => {
        setSelectedLog(log);
        setDetailsOpen(true);
    };

    // Columns for DataTable
    const columns: Column<any>[] = [
        {
            id: "createdAt",
            label: "Executed Date",
            format: (value: any) => new Date(value).toLocaleString(),
        },
        {
            id: "promotionType",
            label: "Type",
            format: (value: string) => {
                const labelMap: Record<string, string> = {
                    single_class: "Class Promotion",
                    bulk: "Bulk Promotion",
                    repeat: "Mark Repeating",
                    graduate: "Graduate Batch",
                    archive: "Archive Year",
                };
                return labelMap[value] || value;
            },
        },
        {
            id: "academicYear",
            label: "Academic Year",
        },
        {
            id: "students",
            label: "Students Affected",
            format: (value: any[]) => value?.length || 0,
        },
        {
            id: "status",
            label: "Status",
            format: (value: string) => {
                const color =
                    value === "completed"
                        ? "success"
                        : value === "rolled_back"
                        ? "error"
                        : "warning";
                return (
                    <Chip
                        label={value.toUpperCase().replace("_", " ")}
                        color={color}
                        size="small"
                    />
                );
            },
        },
        {
            id: "actions",
            label: "Actions",
            format: (_: any, row: any) => (
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewDetails(row)}
                    >
                        Details
                    </Button>
                    {row.rollbackAvailable && row.status === "completed" && (
                        <Button
                            size="small"
                            variant="contained"
                            color="error"
                            disabled={rollbackMutation.isPending}
                            onClick={() => handleRollbackClick(row._id)}
                        >
                            Rollback
                        </Button>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Typography variant="h6" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
                Promotion History & Logs
            </Typography>

            <DataTable
                title="Year-End logs"
                columns={columns}
                data={logs}
                isLoading={isLoading}
                error={error ? "Failed to load logs" : null}
            />

            {/* Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Promotion Action Log Details</DialogTitle>
                <DialogContent>
                    {selectedLog && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Log ID:</strong> {selectedLog._id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Date:</strong>{" "}
                                {new Date(selectedLog.createdAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Notes:</strong> {selectedLog.notes || "None"}
                            </Typography>

                            {selectedLog.students && selectedLog.students.length > 0 ? (
                                <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Student ID</TableCell>
                                                <TableCell>From Class</TableCell>
                                                <TableCell>From Section</TableCell>
                                                <TableCell>To Class</TableCell>
                                                <TableCell>To Section</TableCell>
                                                <TableCell>Result</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedLog.students.map((st: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{st.studentId}</TableCell>
                                                    <TableCell>{st.fromClass}</TableCell>
                                                    <TableCell>{st.fromSection || "-"}</TableCell>
                                                    <TableCell>{st.toClass}</TableCell>
                                                    <TableCell>{st.toSection || "-"}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={st.status.toUpperCase()}
                                                            size="small"
                                                            color={
                                                                st.status === "promoted"
                                                                    ? "success"
                                                                    : st.status === "repeated"
                                                                    ? "warning"
                                                                    : "info"
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    No students affected directly by this log (e.g., Year Archive event).
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDetailsOpen(false)} variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rollback Confirmation Dialog */}
            <ConfirmationDialog
                open={rollbackDialogOpen}
                onClose={() => {
                    setRollbackDialogOpen(false);
                    setRollbackLogId(null);
                }}
                onConfirm={handleExecuteRollback}
                title="Confirm Rollback"
                description="Are you sure you want to rollback this promotion action? This will revert all associated student classes, sections, and historical status updates."
                confirmLabel="Rollback"
                cancelLabel="Cancel"
                variant="danger"
                isLoading={rollbackMutation.isPending}
            />
        </Box>
    );
};

export default PromotionLogs;
