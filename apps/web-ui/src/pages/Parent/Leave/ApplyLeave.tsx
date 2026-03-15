import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    Grid,
    Autocomplete,
    Checkbox,
    Chip,
} from '@mui/material';
import {
    Send as SendIcon,
    ArrowBack as ArrowBackIcon,
    CheckBoxOutlineBlank,
    CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import type { LeaveType, Student } from '../../../types';
import { AppInput } from '../../../components/ui/AppInput';
import { AppSelect } from '../../../components/ui/AppSelect';
import { AppDatePicker } from '../../../components/ui/AppDatePicker';
import { AppButton } from '../../../components/ui/AppButton';
import { useNavigate } from 'react-router-dom';
import TokenService from '../../../queries/token/tokenService';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useApplyLeave } from '../../../queries/Leave';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

type ChildOption = Student & { className?: string; sectionName?: string };

const ParentApplyLeave: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, children, isLoading: loadingChildren } = useChildSelector();

    const isMultiSelect = children.length > 1;

    const [selectedStudents, setSelectedStudents] = useState<ChildOption[]>([]);
    const [formData, setFormData] = useState({
        leaveType: '' as LeaveType | '',
        reason: '',
    });
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const applyLeave = useApplyLeave(schoolId);

    // Initialize selected students
    useEffect(() => {
        if (children.length === 1 && selectedStudents.length === 0) {
            setSelectedStudents([children[0]]);
        } else if (selectedChild && selectedStudents.length === 0) {
            setSelectedStudents([selectedChild]);
        }
    }, [children, selectedChild]);

    const handleChange = (field: string) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (selectedStudents.length === 0 || !formData.leaveType || !formData.reason || !startDate || !endDate) {
            setError('Please fill in all required fields');
            return;
        }

        if (endDate < startDate) {
            setError('End date cannot be before start date');
            return;
        }

        try {
            await applyLeave.mutateAsync({
                leaveType: formData.leaveType as LeaveType,
                reason: formData.reason,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                studentIds: selectedStudents.map(s => s.studentId),
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/parent/leave/history');
            }, 1500);
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Failed to apply for leave');
        }
    };

    const getChildLabel = (child: ChildOption) =>
        `${child.firstName} ${child.lastName} - ${child.className || child.class}`;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/parent/dashboard')}
                    sx={{ mb: 2 }}
                >
                    Back to Dashboard
                </Button>

                <Typography variant="h4" fontWeight={600} gutterBottom>
                    Apply for Leave
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    {isMultiSelect
                        ? 'Submit a leave request for your children'
                        : 'Submit a leave request for your child'}
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Leave request submitted successfully! Redirecting...
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Card sx={{ borderRadius: 4, elevation: 0, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    {isMultiSelect ? (
                                        <Autocomplete
                                            multiple
                                            id="select-children"
                                            options={children}
                                            value={selectedStudents}
                                            onChange={(_event, newValue) => {
                                                setSelectedStudents(newValue as any);
                                            }}
                                            disableCloseOnSelect
                                            getOptionLabel={getChildLabel}
                                            isOptionEqualToValue={(option, value) =>
                                                option.studentId === value.studentId
                                            }
                                            renderOption={(props, option, { selected }) => {
                                                const { key, ...restProps } = props;
                                                return (
                                                    <li key={key} {...restProps}>
                                                        <Checkbox
                                                            icon={<CheckBoxOutlineBlank fontSize="small" />}
                                                            checkedIcon={<CheckBoxIcon fontSize="small" />}
                                                            style={{ marginRight: 8 }}
                                                            checked={selected}
                                                        />
                                                        {getChildLabel(option)}
                                                    </li>
                                                );
                                            }}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => {
                                                    const { key, ...chipProps } = getTagProps({ index });
                                                    return (
                                                        <Chip
                                                            key={key}
                                                            label={`${option.firstName} ${option.lastName}`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            {...chipProps}
                                                        />
                                                    );
                                                })
                                            }
                                            renderInput={(params) => (
                                                <AppInput
                                                    {...params}
                                                    label="Select Children"
                                                    placeholder={selectedStudents.length === 0 ? 'Select one or more children' : ''}
                                                    required
                                                />
                                            )}
                                            loading={loadingChildren}
                                        />
                                    ) : (
                                        <AppInput
                                            fullWidth
                                            label="Selected Child"
                                            value={selectedStudents.length > 0 ? getChildLabel(selectedStudents[0]) : ''}
                                            disabled
                                        />
                                    )}
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <AppSelect
                                        label="Reason for Leave"
                                        value={formData.leaveType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value as LeaveType }))}
                                        options={[
                                            { value: 'sick', label: 'Sick Leave' },
                                            { value: 'casual', label: 'Casual Leave' },
                                            { value: 'emergency', label: 'Emergency Leave' },
                                            { value: 'personal', label: 'Personal Leave' },
                                            { value: 'other', label: 'Other' },
                                        ]}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <AppDatePicker
                                        label="Start Date"
                                        value={startDate}
                                        onChange={(date: Date | null) => setStartDate(date)}
                                        minDate={new Date()}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <AppDatePicker
                                        label="End Date"
                                        value={endDate}
                                        onChange={(date: Date | null) => setEndDate(date)}
                                        minDate={startDate || new Date()}
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <AppInput
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Detailed Explanation"
                                        value={formData.reason}
                                        onChange={handleChange('reason')}
                                        placeholder="Please provide details about your leave request..."
                                        required
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                                        <AppButton
                                            variant="text"
                                            color="inherit"
                                            onClick={() => navigate('/parent/dashboard')}
                                        >
                                            Discard
                                        </AppButton>
                                        <AppButton
                                            type="submit"
                                            variant="contained"
                                            startIcon={<SendIcon />}
                                            loading={applyLeave.isPending}
                                        >
                                            Submit Application
                                        </AppButton>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </LocalizationProvider>
    );
};

export default ParentApplyLeave;
