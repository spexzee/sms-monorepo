import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    Typography,
    Box,
    Chip,
    Divider,
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useCreateClass, useUpdateClass, useAddSection } from '../../queries/Class';
import type { Class, CreateClassPayload } from '../../types';
import { AppInput } from '../ui/AppInput';
import { AppButton } from '../ui/AppButton';

interface ClassDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Class | null;
}

interface SectionInput {
    name: string;
    isNew?: boolean;
}

const ClassDialog: React.FC<ClassDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateClassPayload>({
        name: '',
        description: '',
        sections: [],
    });

    const [newSections, setNewSections] = useState<SectionInput[]>([]);
    const [newSectionName, setNewSectionName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateClass(schoolId);
    const updateMutation = useUpdateClass(schoolId);
    const addSectionMutation = useAddSection(schoolId);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                description: editData.description || '',
                sections: [],
            });
            setNewSections([]);
        } else {
            setFormData({
                name: '',
                description: '',
                sections: [],
            });
            setNewSections([]);
        }
    }, [editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddSection = () => {
        if (!newSectionName.trim()) return;

        // Check for duplicate section names
        const existingSections = isEditMode ? editData?.sections || [] : [];
        const allSectionNames = [
            ...existingSections.map(s => s.name.toLowerCase()),
            ...newSections.map(s => s.name.toLowerCase()),
        ];

        if (allSectionNames.includes(newSectionName.toLowerCase())) {
            setErrors((prev) => ({ ...prev, section: 'Section name already exists' }));
            return;
        }

        setNewSections((prev) => [...prev, { name: newSectionName, isNew: true }]);
        setNewSectionName('');
        setErrors((prev) => ({ ...prev, section: '' }));
    };

    const handleRemoveNewSection = (index: number) => {
        setNewSections((prev) => prev.filter((_, i) => i !== index));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Class name is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            if (isEditMode && editData) {
                // Update class details
                await updateMutation.mutateAsync({
                    classId: editData.classId,
                    data: {
                        name: formData.name,
                        description: formData.description,
                    },
                });

                // Add new sections one by one
                for (const section of newSections) {
                    await addSectionMutation.mutateAsync({
                        classId: editData.classId,
                        data: { name: section.name },
                    });
                }
            } else {
                // Create class with sections
                await createMutation.mutateAsync({
                    ...formData,
                    sections: newSections.map(s => ({ name: s.name })),
                });
            }
            handleClose();
        } catch {
            // Error handled by mutation
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            sections: [],
        });
        setNewSections([]);
        setNewSectionName('');
        setErrors({});
        createMutation.reset();
        updateMutation.reset();
        addSectionMutation.reset();
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending || addSectionMutation.isPending;
    const isError = createMutation.isError || updateMutation.isError || addSectionMutation.isError;
    const errorMessage = (createMutation.error as { message?: string })?.message ||
        (updateMutation.error as { message?: string })?.message ||
        (addSectionMutation.error as { message?: string })?.message ||
        'Operation failed';

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditMode ? 'Edit Class Configuration' : 'Create New Class'}
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {isError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Core Definition
                        </Typography>

                        <AppInput
                            name="name"
                            label="Class Designation"
                            value={formData.name}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                            fullWidth
                            placeholder="e.g., Grade 10-A, Year 5"
                        />

                        <AppInput
                            name="description"
                            label="Brief Description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Optional metadata about this class"
                        />

                        <Divider sx={{ my: 0.5 }} />
                        
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Section Management
                        </Typography>

                        {/* Existing Sections (in edit mode) */}
                        {isEditMode && editData && editData.sections.length > 0 && (
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                    Active Sections
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {editData.sections.map((section) => (
                                        <Chip
                                            key={section.sectionId}
                                            label={section.name}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                            sx={{ borderRadius: '6px' }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Add New Sections */}
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                {isEditMode ? 'Append New Sections' : 'Define Sections'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                <AppInput
                                    placeholder="Section ID (e.g., A, B, Blue)"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    error={!!errors.section}
                                    helperText={errors.section}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSection();
                                        }
                                    }}
                                    sx={{ flex: 1 }}
                                />
                                <AppButton
                                    variant="outlined"
                                    onClick={handleAddSection}
                                    sx={{ minWidth: '80px', height: '45px' }}
                                >
                                    Add
                                </AppButton>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {newSections.map((section, index) => (
                                    <Chip
                                        key={index}
                                        label={section.name}
                                        color="success"
                                        size="small"
                                        onDelete={() => handleRemoveNewSection(index)}
                                        deleteIcon={<DeleteIcon />}
                                        sx={{ borderRadius: '6px' }}
                                    />
                                ))}
                                {newSections.length === 0 && !isEditMode && (
                                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                        No sections defined yet
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={handleClose} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton
                        type="submit"
                        variant="contained"
                        loading={isPending}
                    >
                        {isEditMode ? 'Update Configuration' : 'Create Class'}
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ClassDialog;
