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
    Autocomplete,
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useCreateClass, useUpdateClass, useAddSection } from '../../queries/Class';
import { useNotification } from '../../hooks/useNotification';
import { useGetTeachers } from '../../queries/Teacher';
import type { Class, CreateClassPayload, Teacher } from '../../types';
import { AppInput } from '../shared/AppInput';
import { AppButton } from '../shared/AppButton';

interface ClassDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Class | null;
}

interface SectionInput {
    name: string;
    teacherId?: string;
    teacherLabel?: string;
    isNew?: boolean;
}

const ClassDialog: React.FC<ClassDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;
    const notification = useNotification();

    const [formData, setFormData] = useState<CreateClassPayload>({
        name: '',
        description: '',
        sections: [],
    });

    const [newSections, setNewSections] = useState<SectionInput[]>([]);
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionTeacher, setNewSectionTeacher] = useState<{ id: string; label: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateClass(schoolId);
    const updateMutation = useUpdateClass(schoolId);
    const addSectionMutation = useAddSection(schoolId);

    // Fetch teachers for autocomplete (all active, no pagination limit)
    const { data: teachersData } = useGetTeachers(schoolId, { status: 'active', limit: 9999 } as any);
    const teachers: Teacher[] = teachersData?.data || [];
    const teacherOptions = teachers.map((t) => ({
        id: t.teacherId,
        label: `${t.firstName} ${t.lastName}`,
    }));

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                description: editData.description || '',
                sections: [],
            });
        } else {
            setFormData({ name: '', description: '', sections: [] });
        }
        setNewSections([]);
        setNewSectionName('');
        setNewSectionTeacher(null);
    }, [editData, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleAddSection = () => {
        if (!newSectionName.trim()) return;

        const existingSections = isEditMode ? editData?.sections || [] : [];
        const allNames = [
            ...existingSections.map((s) => s.name.toLowerCase()),
            ...newSections.map((s) => s.name.toLowerCase()),
        ];

        if (allNames.includes(newSectionName.toLowerCase())) {
            setErrors((prev) => ({ ...prev, section: 'Section name already exists' }));
            return;
        }

        setNewSections((prev) => [
            ...prev,
            {
                name: newSectionName,
                teacherId: newSectionTeacher?.id,
                teacherLabel: newSectionTeacher?.label,
                isNew: true,
            },
        ]);
        setNewSectionName('');
        setNewSectionTeacher(null);
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
                await updateMutation.mutateAsync({
                    classId: editData.classId,
                    data: { name: formData.name, description: formData.description },
                });

                // Add new sections one by one (with optional teacher)
                for (const section of newSections) {
                    await addSectionMutation.mutateAsync({
                        classId: editData.classId,
                        data: {
                            name: section.name,
                            classTeacherId: section.teacherId || undefined,
                        },
                    });
                }
                notification.success("Class configuration optimized");
            } else {
                await createMutation.mutateAsync({
                    ...formData,
                    sections: newSections.map((s) => ({
                        name: s.name,
                        classTeacherId: s.teacherId || undefined,
                    })),
                });
                notification.success("New academic class established");
            }
            handleClose();
        } catch {
            notification.error("Failed to establish class hierarchy.");
        }
    };

    const handleClose = () => {
        setFormData({ name: '', description: '', sections: [] });
        setNewSections([]);
        setNewSectionName('');
        setNewSectionTeacher(null);
        setErrors({});
        createMutation.reset();
        updateMutation.reset();
        addSectionMutation.reset();
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending || addSectionMutation.isPending;
    const isError = createMutation.isError || updateMutation.isError || addSectionMutation.isError;
    const errorMessage =
        (createMutation.error as { message?: string })?.message ||
        (updateMutation.error as { message?: string })?.message ||
        (addSectionMutation.error as { message?: string })?.message ||
        'Operation failed';

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {isEditMode ? 'Edit Class Configuration' : 'Create New Class'}
                </Typography>
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

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* ── Core Definition ── */}
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Core Definition
                        </Typography>

                        <AppInput
                            name="name"
                            label="Class Name"
                            value={formData.name}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                            fullWidth
                            placeholder="e.g., Grade 10, Year 5"
                        />

                        <AppInput
                            name="description"
                            label="Description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Optional notes about this class"
                        />

                        <Divider sx={{ my: 0.5 }} />

                        {/* ── Section Management ── */}
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Section Management
                        </Typography>

                        {/* Existing Sections (edit mode) */}
                        {isEditMode && editData && editData.sections.length > 0 && (
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                    Existing Sections
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {editData.sections.map((section) => {
                                        const teacher = teachers.find((t) => t.teacherId === section.classTeacherId);
                                        const label = teacher
                                            ? `${section.name} · ${teacher.firstName} ${teacher.lastName}`
                                            : section.name;
                                        return (
                                            <Chip
                                                key={section.sectionId}
                                                label={label}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                                sx={{ borderRadius: '6px' }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}

                        {/* Add New Section */}
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                {isEditMode ? 'Append New Section' : 'Define Sections'}
                            </Typography>

                            {/* Section name + teacher row */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                                <AppInput
                                    placeholder="Section name (e.g., A, B)"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    error={!!errors.section}
                                    helperText={errors.section}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') { e.preventDefault(); handleAddSection(); }
                                    }}
                                    sx={{ flex: 1, minWidth: 120 }}
                                />
                                <Autocomplete
                                    options={teacherOptions}
                                    getOptionLabel={(o) => o.label}
                                    value={newSectionTeacher}
                                    onChange={(_, v) => setNewSectionTeacher(v)}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    sx={{ flex: 2, minWidth: 180 }}
                                    renderInput={(params) => (
                                        <AppInput
                                            {...params}
                                            placeholder="Assign teacher (optional)"
                                        />
                                    )}
                                />
                                <AppButton
                                    variant="outlined"
                                    onClick={handleAddSection}
                                    sx={{ minWidth: '72px', height: '45px', flexShrink: 0 }}
                                >
                                    Add
                                </AppButton>
                            </Box>

                            {/* Staged new sections */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {newSections.map((section, index) => (
                                    <Chip
                                        key={index}
                                        label={section.teacherLabel ? `${section.name} · ${section.teacherLabel}` : section.name}
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
                    <AppButton type="submit" variant="contained" loading={isPending}>
                        {isEditMode ? 'Update Configuration' : 'Create Class'}
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ClassDialog;
