import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Alert,
    Card,
    CardContent,
    Chip,
    Grid,
} from '@mui/material';
import {
    Send as SendIcon,
    CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApplyLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveType } from '../../../types';
import { AppInput } from '../../../components/ui/AppInput';
import { AppSelect } from '../../../components/ui/AppSelect';
import { AppButton } from '../../../components/ui/AppButton';
import { AppDatePicker } from '../../../components/ui/AppDatePicker';
import { format } from 'date-fns';

const leaveTypes: { value: LeaveType; label: string; description: string }[] = [
    { value: 'casual', label: 'Casual Leave', description: 'For personal matters' },
    { value: 'sick', label: 'Sick Leave', description: 'For health issues' },
    { value: 'emergency', label: 'Emergency Leave', description: 'For urgent situations' },
    { value: 'personal', label: 'Personal Leave', description: 'For personal reasons' },
    { value: 'other', label: 'Other', description: 'Any other reason' },
];

const ApplyLeave: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';

    const [formData, setFormData] = useState({
        leaveType: '' as LeaveType | '',
        startDate: '',
        endDate: '',
        reason: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const applyMutation = useApplyLeave(schoolId);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.leaveType) newErrors.leaveType = 'Please select leave type';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
            newErrors.endDate = 'End date cannot be before start date';
        }
        if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason';
        if (formData.reason.trim().length < 10) newErrors.reason = 'Reason must be at least 10 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await applyMutation.mutateAsync({
                leaveType: formData.leaveType as LeaveType,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason.trim(),
            });
            setSubmitted(true);
        } catch {
            // Error handled by mutation
        }
    };

    // Calculate number of days
    const calculateDays = () => {
        if (!formData.startDate || !formData.endDate) return 0;
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    if (submitted) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Card sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center', p: 4 }}>
                    <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                        Leave Application Submitted!
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Your leave request has been sent for approval. You will be notified once it's processed.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <AppButton variant="outlined" onClick={() => navigate('/student/leave/my')}>
                            View My Leaves
                        </AppButton>
                        <AppButton variant="contained" onClick={() => { setSubmitted(false); setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' }); }}>
                            Apply Another
                        </AppButton>
                    </Box>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Apply for Leave
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Fill out the form below to submit your leave request.
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3 }}>
                        {applyMutation.isError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {(applyMutation.error as { message?: string })?.message || 'Failed to submit leave request'}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Leave Type */}
                                <AppSelect
                                    label="Leave Type"
                                    value={formData.leaveType}
                                    options={leaveTypes.map((type) => ({ value: type.value, label: type.label }))}
                                    onChange={(e) => handleChange('leaveType', e.target.value as string)}
                                    error={!!errors.leaveType}
                                    helperText={errors.leaveType}
                                />

                                {/* Dates */}
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <AppDatePicker
                                        label="Start Date"
                                        value={formData.startDate ? new Date(formData.startDate) : null}
                                        onChange={(date) => handleChange('startDate', date ? format(date, 'yyyy-MM-dd') : '')}
                                        error={!!errors.startDate}
                                        helperText={errors.startDate}
                                    />
                                    <AppDatePicker
                                        label="End Date"
                                        value={formData.endDate ? new Date(formData.endDate) : null}
                                        onChange={(date) => handleChange('endDate', date ? format(date, 'yyyy-MM-dd') : '')}
                                        error={!!errors.endDate}
                                        helperText={errors.endDate}
                                    />
                                </Box>

                                {/* Reason */}
                                <AppInput
                                    label="Reason for Leave"
                                    placeholder="Please describe why you need leave..."
                                    value={formData.reason}
                                    onChange={(e) => handleChange('reason', e.target.value)}
                                    multiline
                                    rows={4}
                                    error={!!errors.reason}
                                    helperText={errors.reason || `${formData.reason.length}/500 characters`}
                                    inputProps={{ maxLength: 500 }}
                                    fullWidth
                                />

                                {/* Submit */}
                                <AppButton
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    loading={applyMutation.isPending}
                                    startIcon={!applyMutation.isPending && <SendIcon />}
                                >
                                    Submit Leave Request
                                </AppButton>
                            </Box>
                        </form>
                    </Paper>
                </Grid>

                {/* Summary Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Leave Summary</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">Type:</Typography>
                                    <Chip
                                        label={formData.leaveType ? leaveTypes.find(t => t.value === formData.leaveType)?.label : 'Not selected'}
                                        size="small"
                                        color={formData.leaveType ? 'primary' : 'default'}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">Duration:</Typography>
                                    <Typography fontWeight={600}>{calculateDays()} day(s)</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">From:</Typography>
                                    <Typography>{formData.startDate || '-'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">To:</Typography>
                                    <Typography>{formData.endDate || '-'}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ApplyLeave;
