import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Box,
    Grid,
    Alert,
    Divider,
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AppInput } from '../shared/AppInput';
import { AppSelect } from '../shared/AppSelect';
import { AppDatePicker } from '../shared/AppDatePicker';
import { AppButton } from '../shared/AppButton';
import FileUpload from '../FileUpload/FileUpload';
import { useCreateHomework, useUpdateHomework } from '../../queries/Homework';
import { useGetClasses } from '../../queries/Class';
import { useGetSubjects } from '../../queries/Subject';
import TokenService from '../../queries/token/tokenService';
import type { Homework, CreateHomeworkPayload, AnnouncementAttachment } from '../../types';

interface HomeworkDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Homework | null;
}

const HomeworkDialog: React.FC<HomeworkDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<Omit<CreateHomeworkPayload, 'dueDate'>>({
        classId: '',
        sectionId: '',
        subjectId: '',
        title: '',
        description: '',
        attachmentUrl: '',
        referenceLinks: [''],
        attachments: [],
    });
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [error, setError] = useState('');

    const { data: classesData } = useGetClasses(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);

    const createMutation = useCreateHomework(schoolId);
    const updateMutation = useUpdateHomework(schoolId);

    const classes = classesData?.data || [];
    const subjects = subjectsData?.data || [];
    const selectedClass = classes.find((c: any) => c.classId === formData.classId);
    const sections = selectedClass?.sections || [];

    useEffect(() => {
        if (editData) {
            setFormData({
                classId: editData.classId || '',
                sectionId: editData.sectionId || '',
                subjectId: editData.subjectId || '',
                title: editData.title || '',
                description: editData.description || '',
                attachmentUrl: editData.attachmentUrl || '',
                referenceLinks: editData.referenceLinks?.length ? editData.referenceLinks : [''],
                attachments: editData.attachments || [],
            });
            setDueDate(editData.dueDate ? new Date(editData.dueDate) : null);
        } else {
            setFormData({
                classId: '',
                sectionId: '',
                subjectId: '',
                title: '',
                description: '',
                attachmentUrl: '',
                referenceLinks: [''],
                attachments: [],
            });
            setDueDate(null);
        }
        setError('');
    }, [editData, open]);

    const handleClose = () => {
        setError('');
        createMutation.reset();
        updateMutation.reset();
        onClose();
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    const handleAddLink = () => {
        setFormData(prev => ({
            ...prev,
            referenceLinks: [...(prev.referenceLinks || []), '']
        }));
    };

    const handleRemoveLink = (index: number) => {
        setFormData(prev => ({
            ...prev,
            referenceLinks: prev.referenceLinks?.filter((_, i) => i !== index)
        }));
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...(formData.referenceLinks || [])];
        newLinks[index] = value;
        setFormData(prev => ({ ...prev, referenceLinks: newLinks }));
    };

    const handleFilesChange = (newAttachments: AnnouncementAttachment[]) => {
        setFormData(prev => ({ ...prev, attachments: newAttachments }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.classId || !formData.subjectId || !formData.title || !formData.description || !dueDate) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const payload = {
                ...formData,
                referenceLinks: formData.referenceLinks?.filter(link => link.trim() !== ''),
                dueDate: dueDate.toISOString(),
            };

            if (isEditMode && editData) {
                await updateMutation.mutateAsync({
                    homeworkId: editData.homeworkId,
                    ...payload,
                });
            } else {
                await createMutation.mutateAsync(payload as CreateHomeworkPayload);
            }
            handleClose();
        } catch (err: any) {
            setError(err?.message || `Failed to ${isEditMode ? 'update' : 'create'} homework`);
        }
    };

    const user = TokenService.getUser();
    const teacherName = user ? `${user.firstName || ''}_${user.lastName || ''}`.replace(/\s+/g, '_') : 'teacher';
    const className = selectedClass?.name?.replace(/\s+/g, '_') || 'class';
    const imageKitFolder = `homework/${teacherName}/${className}`;

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                            {isEditMode ? 'Modify Assignment' : 'New Academic Assignment'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {isEditMode ? 'Update homework details and materials' : 'Fill in the details to assign new work to students'}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small" sx={{ bgcolor: 'action.hover' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ p: 3, pt: 0 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                                    Placement & Schedule
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <AppSelect
                                    label="Class"
                                    value={formData.classId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value as string, sectionId: '' }))}
                                    options={classes.map((c: any) => ({ value: c.classId, label: c.name }))}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <AppSelect
                                    label="Section"
                                    value={formData.sectionId}
                                    onChange={(e) => handleChange('sectionId', e.target.value)}
                                    options={[{ value: '', label: 'All Sections' }, ...sections.map((s: any) => ({ value: s.sectionId, label: s.name }))]}
                                    disabled={!formData.classId}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <AppSelect
                                    label="Subject"
                                    value={formData.subjectId}
                                    onChange={(e) => handleChange('subjectId', e.target.value)}
                                    options={subjects.map((s: any) => ({ value: s.subjectId, label: s.name }))}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <AppDatePicker
                                    label="Due Date"
                                    value={dueDate}
                                    onChange={(date: Date | null) => setDueDate(date)}
                                    minDate={new Date()}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                                    Assignment Details
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <AppInput
                                    fullWidth
                                    label="Homework Title"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="e.g., Chapter 5 Exercises"
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <AppInput
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Instructions"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Details about the homework..."
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                                    Resources & Materials
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                        Web Reference Links
                                    </Typography>
                                    {(formData.referenceLinks || []).map((link, index) => (
                                        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                            <AppInput
                                                fullWidth
                                                placeholder="https://..."
                                                value={link}
                                                onChange={(e) => handleLinkChange(index, e.target.value)}
                                            />
                                            <IconButton
                                                color="error"
                                                onClick={() => handleRemoveLink(index)}
                                                disabled={formData.referenceLinks?.length === 1}
                                                sx={{ bgcolor: 'error.50', borderRadius: 1.5, '&:hover': { bgcolor: 'error.100' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <AppButton
                                        startIcon={<AddIcon />}
                                        variant="outlined"
                                        size="small"
                                        onClick={handleAddLink}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Add Another Link
                                    </AppButton>
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <FileUpload
                                    folder={imageKitFolder}
                                    baseFileName={`homework_${formData.title.replace(/\s+/g, '_')}`}
                                    currentAttachments={formData.attachments}
                                    onUploadSuccess={handleFilesChange}
                                    label="Upload Attachments (PDFs, Images, Docs)"
                                    maxFiles={5}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>

                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <AppButton onClick={handleClose} variant="text" color="inherit">
                            Discard
                        </AppButton>
                        <AppButton
                            type="submit"
                            variant="contained"
                            loading={isPending}
                            sx={{ minWidth: 140, borderRadius: 2 }}
                        >
                            {isEditMode ? 'Apply Changes' : 'Assign Homework'}
                        </AppButton>
                    </DialogActions>
                </form>
            </Dialog>
        </LocalizationProvider>
    );
};

export default HomeworkDialog;
