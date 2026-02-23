import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    MenuItem,
    Alert,
    CircularProgress,
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useApplyLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveType, Student } from '../../../types';

type ChildOption = Student & { className?: string; sectionName?: string };

const leaveTypes: { value: LeaveType; label: string }[] = [
    { value: 'sick', label: 'Sick Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'other', label: 'Other' },
];

// Custom styling for date pickers
const datePickerSlotProps = {
    textField: {
        fullWidth: true,
        variant: 'outlined' as const,
        sx: {
            '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    backgroundColor: 'action.hover',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                    },
                },
                '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                },
            },
            '& .MuiInputLabel-root': {
                fontWeight: 500,
            },
        },
    },
    actionBar: {
        actions: ['clear', 'today'] as ('clear' | 'today' | 'cancel' | 'accept')[],
    },
    popper: {
        sx: {
            '& .MuiPaper-root': {
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            },
            '& .MuiDateCalendar-root': {
                height: 300,
            },
            '& .MuiDayCalendar-slideTransition': {
                minHeight: 180,
            },
            '& .MuiDayCalendar-weekContainer': {
                margin: '1px 0',
            },
            '& .MuiDialogActions-root': {
                padding: '4px 8px',
            },
            '& .MuiDayCalendar-weekDayLabel': {
                fontWeight: 600,
                color: 'primary.main',
            },
            '& .MuiPickersDay-root': {
                borderRadius: 2,
                '&:hover': {
                    backgroundColor: 'primary.light',
                },
                '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    '&:hover': {
                        backgroundColor: 'primary.dark',
                    },
                },
            },
        },
    },
};

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

                <Card>
                    <CardContent>
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
                                                setSelectedStudents(newValue as ChildOption[]);
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
                                                <TextField
                                                    {...params}
                                                    label="Select Children *"
                                                    placeholder={selectedStudents.length === 0 ? 'Select one or more children' : ''}
                                                />
                                            )}
                                            loading={loadingChildren}
                                        />
                                    ) : (
                                        <TextField
                                            fullWidth
                                            label="Child *"
                                            value={selectedStudents.length > 0 ? getChildLabel(selectedStudents[0]) : ''}
                                            disabled
                                            InputProps={{ readOnly: true }}
                                        />
                                    )}
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Leave Type *"
                                        value={formData.leaveType}
                                        onChange={handleChange('leaveType')}
                                    >
                                        {leaveTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <DatePicker
                                        label="Start Date *"
                                        value={startDate}
                                        onChange={(date: Date | null) => setStartDate(date)}
                                        minDate={new Date()}
                                        slotProps={datePickerSlotProps}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <DatePicker
                                        label="End Date *"
                                        value={endDate}
                                        onChange={(date: Date | null) => setEndDate(date)}
                                        minDate={startDate || new Date()}
                                        slotProps={datePickerSlotProps}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Reason *"
                                        value={formData.reason}
                                        onChange={handleChange('reason')}
                                        placeholder="Please provide a detailed reason for the leave..."
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => navigate('/parent/dashboard')}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={applyLeave.isPending ? <CircularProgress size={20} /> : <SendIcon />}
                                            disabled={applyLeave.isPending}
                                        >
                                            Submit Request
                                        </Button>
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
