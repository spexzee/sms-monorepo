import { useState, useEffect } from "react";
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
import { useCreateSubject, useUpdateSubject } from '../../queries/Subject';
import type { Subject, CreateSubjectPayload } from '../../types';
import { AppInput } from '../ui/AppInput';
import { AppButton } from '../ui/AppButton';

interface SubjectDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Subject | null;
    initialClassId?: string;
    initialSectionId?: string;
}

const SubjectDialog: React.FC<SubjectDialogProps> = ({
    open,
    onClose,
    schoolId,
    editData,
}) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateSubjectPayload>({
        name: "",
        code: "",
        description: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateSubject(schoolId);
    const updateMutation = useUpdateSubject(schoolId);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || "",
                code: editData.code || "",
                description: editData.description || "",
            });
        } else {
            setFormData({
                name: "",
                code: "",
                description: "",
            });
        }
    }, [editData, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "Subject name is required";
        if (!formData.code.trim()) {
            newErrors.code = "Subject code is required";
        } else if (formData.code.length > 10) {
            newErrors.code = "Code must be 10 characters or less";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            if (isEditMode && editData) {
                await updateMutation.mutateAsync({
                    subjectId: editData.subjectId,
                    data: formData,
                });
            } else {
                await createMutation.mutateAsync(formData);
            }
            handleClose();
        } catch {
            // Error handled by mutation
        }
    };

    const handleClose = () => {
        setFormData({
            name: "",
            code: "",
            description: "",
        });
        setErrors({});
        createMutation.reset();
        updateMutation.reset();
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const isError = createMutation.isError || updateMutation.isError;
    const errorMessage =
        (createMutation.error as { message?: string })?.message ||
        (updateMutation.error as { message?: string })?.message ||
        "Operation failed";

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditMode ? 'Modify Subject Profile' : 'Register New Subject'}
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <Divider />
                <DialogContent sx={{ py: 3 }}>
                    {isError && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Subject Identification
                        </Typography>

                        <AppInput
                            name="name"
                            label="Official Subject Name"
                            value={formData.name}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                            fullWidth
                            placeholder="e.g., Advanced Mathematics, World History"
                        />

                        <AppInput
                            name="code"
                            label="Identifier Code"
                            value={formData.code}
                            onChange={handleChange}
                            error={!!errors.code}
                            helperText={errors.code || 'Short code for internal tracking (e.g., MATH101)'}
                            required
                            fullWidth
                            inputProps={{ style: { textTransform: 'uppercase' } }}
                            placeholder="MATH01"
                        />

                        <Divider sx={{ my: 0.5 }} />

                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Categorization & Notes
                        </Typography>

                        <AppInput
                            name="description"
                            label="Subject Overview"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Briefly describe the curriculum or scope of this subject"
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={handleClose} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton
                        type="submit"
                        variant="contained"
                        loading={isPending}
                    >
                        {isEditMode ? 'Update Subject' : 'Create Subject'}
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default SubjectDialog;
