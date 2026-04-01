import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    Box,
    Typography,
    Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateRequest } from '../../queries/Request';
import type { CreateRequestPayload } from '../../types';
import { AppInput } from '../shared/AppInput';
import { AppSelect } from '../shared/AppSelect';
import { AppButton } from '../shared/AppButton';

interface RequestChangeDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    userId: string;
    userName: string;
    userType: "teacher" | "student" | "parent" | "sch_admin";
    fieldType?: "email_change" | "phone_change" | "general";
    currentValue?: string;
}

const RequestChangeDialog: React.FC<RequestChangeDialogProps> = ({
    open,
    onClose,
    schoolId,
    userId,
    userName,
    userType,
    fieldType = "general",
    currentValue = "",
}) => {
    const [requestType, setRequestType] = useState<"email_change" | "phone_change" | "general">(fieldType);
    const [newValue, setNewValue] = useState("");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateRequest(schoolId);

    // Sync requestType with fieldType prop when dialog opens
    useEffect(() => {
        if (open) {
            setRequestType(fieldType);
        }
    }, [open, fieldType]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!message.trim()) newErrors.message = "Message is required";
        if (requestType !== "general" && !newValue.trim()) {
            newErrors.newValue = "New value is required";
        }
        if (requestType === "email_change" && newValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
            newErrors.newValue = "Invalid email format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const payload: CreateRequestPayload = {
            userType,
            userId,
            userName,
            requestType,
            oldValue: currentValue,
            newValue: requestType !== "general" ? newValue : undefined,
            message,
        };

        try {
            await createMutation.mutateAsync(payload);
            handleClose();
        } catch {
            // Error handled by mutation
        }
    };

    const handleClose = () => {
        setRequestType(fieldType);
        setNewValue("");
        setMessage("");
        setErrors({});
        createMutation.reset();
        onClose();
    };

    const getTitle = () => {
        switch (requestType) {
            case "email_change": return "Request Email Change";
            case "phone_change": return "Request Phone Change";
            default: return "Submit Request";
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{getTitle()}</Typography>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {createMutation.isError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {(createMutation.error as { message?: string })?.message || 'Failed to submit request'}
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Request Specifics
                        </Typography>

                        <AppSelect
                            label="Modification Type"
                            value={requestType}
                            options={[
                                { value: "email_change", label: "Email Update" },
                                { value: "phone_change", label: "Phone Number Update" },
                                { value: "general", label: "General Support Query" },
                            ]}
                            onChange={(e) => setRequestType(e.target.value as any)}
                        />

                        {requestType !== "general" && currentValue && (
                            <AppInput
                                label="Existing Recorded Value"
                                value={currentValue}
                                disabled
                                fullWidth
                            />
                        )}

                        {requestType !== "general" && (
                            <AppInput
                                label={requestType === "email_change" ? "Proposed New Email" : "Proposed New Phone"}
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                error={!!errors.newValue}
                                helperText={errors.newValue}
                                required
                                fullWidth
                                placeholder={requestType === "email_change" ? "new.email@example.com" : "+1234567890"}
                            />
                        )}

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Validation & Reason
                        </Typography>

                        <AppInput
                            label="Justification / Details"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            error={!!errors.message}
                            helperText={errors.message}
                            required
                            multiline
                            rows={4}
                            fullWidth
                            placeholder="Please provide a clear reason for this modification request..."
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={handleClose} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton
                        type="submit"
                        variant="contained"
                        loading={createMutation.isPending}
                    >
                        Submit Request
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default RequestChangeDialog;
