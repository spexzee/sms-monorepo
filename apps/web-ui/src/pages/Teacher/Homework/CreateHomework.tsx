import React, { useState } from 'react';
import {
    Box,
    Typography,
    Alert,
    Grid,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { CreateHomeworkPayload } from '../../../types';
import { AppInput } from '../../../components/ui/AppInput';
import { AppSelect } from '../../../components/ui/AppSelect';
import { AppDatePicker } from '../../../components/ui/AppDatePicker';
import { AppButton } from '../../../components/ui/AppButton';
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
                            <AppInput
                                fullWidth
                                label="Reference Material Link"
                                value={formData.attachmentUrl}
                                onChange={handleChange('attachmentUrl')}
                                placeholder="https://..."
                                labelHint="Optional"
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
