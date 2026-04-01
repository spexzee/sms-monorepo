import React, { useState } from 'react';
import {
    Box,
    Typography,
    Alert,
    Grid,
    IconButton,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import FileUpload from '../../../components/FileUpload/FileUpload';
import type { AnnouncementAttachment } from '../../../types';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { CreateHomeworkPayload } from '../../../types';
import { AppInput } from '../../../components/shared/AppInput';
import { AppSelect } from '../../../components/shared/AppSelect';
import { AppDatePicker } from '../../../components/shared/AppDatePicker';
import { AppButton } from '../../../components/shared/AppButton';
import { useNavigate } from 'react-router-dom';
import TokenService from '../../../queries/token/tokenService';
import { useGetClasses } from '../../../queries/Class';
import { useGetSubjects } from '../../../queries/Subject';
import { useCreateHomework } from '../../../queries/Homework';


const CreateHomework: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';

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
    const [success, setSuccess] = useState(false);

    const { data: classesData } = useGetClasses(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const createHomework = useCreateHomework(schoolId);

    const classes = classesData?.data || [];
    const subjects = subjectsData?.data || [];

    const selectedClass = classes.find((c: { classId: string }) => c.classId === formData.classId);
    const sections = selectedClass?.sections || [];

    const handleChange = (field: keyof Omit<CreateHomeworkPayload, 'dueDate'>) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
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

    const user = TokenService.getUser();
    const teacherName = user ? `${user.firstName || ''}_${user.lastName || ''}`.replace(/\s+/g, '_') : 'teacher';
    const className = selectedClass?.name?.replace(/\s+/g, '_') || 'class';
    const imageKitFolder = `homework/${teacherName}/${className}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.classId || !formData.subjectId || !formData.title || !formData.description || !dueDate) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            await createHomework.mutateAsync({
                ...formData,
                referenceLinks: formData.referenceLinks?.filter(link => link.trim() !== ''),
                dueDate: dueDate.toISOString(),
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/teacher/homework');
            }, 1500);
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Failed to create homework');
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <AppButton
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/teacher/dashboard')}
                    sx={{ mb: 2 }}
                    variant="text"
                    color="inherit"
                >
                    Back to Dashboard
                </AppButton>

                <Typography variant="h4" fontWeight={600} gutterBottom>
                    Create Homework
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Assign new tasks and study materials to your students
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Homework created successfully! Redirecting...
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
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
                                onChange={(e) => setFormData(prev => ({ ...prev, sectionId: e.target.value as string }))}
                                options={sections.map((s: any) => ({ value: s.sectionId, label: s.name }))}
                                disabled={!formData.classId}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <AppSelect
                                label="Subject"
                                value={formData.subjectId}
                                onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value as string }))}
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
                            <AppInput
                                fullWidth
                                label="Homework Title"
                                value={formData.title}
                                onChange={handleChange('title')}
                                placeholder="e.g., Chapter 5 Exercises"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <AppInput
                                fullWidth
                                multiline
                                rows={6}
                                label="Assignment Details"
                                value={formData.description}
                                onChange={handleChange('description')}
                                placeholder="Instructions and details about the homework..."
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Reference Material Links (Optional)
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
                                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                                <AppButton
                                    startIcon={<AddIcon />}
                                    variant="outlined"
                                    size="small"
                                    onClick={handleAddLink}
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
                                label="Attachment Files (Optional)"
                                maxFiles={5}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                                <AppButton
                                    variant="text"
                                    color="inherit"
                                    onClick={() => navigate('/teacher/dashboard')}
                                >
                                    Cancel
                                </AppButton>
                                <AppButton
                                    type="submit"
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    loading={createHomework.isPending}
                                >
                                    Create Homework
                                </AppButton>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default CreateHomework;
