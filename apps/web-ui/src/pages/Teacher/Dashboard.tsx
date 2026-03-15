import React from 'react';
import { Box, Typography, Grid, Avatar, Stack, Skeleton, Alert, Chip } from '@mui/material';
import {
    People as StudentsIcon,
    Schedule as ScheduleIcon,
    Assessment as AttendanceIcon,
    EventAvailable as EventIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TokenService from '../../queries/token/tokenService';
import { useGetTeacherDashboardStats } from '../../queries/TeacherDashboard';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppSection } from '../../components/ui/AppSection';

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId() || '';

    const { data, isLoading, error } = useGetTeacherDashboardStats(schoolId);
    const stats = data?.data;

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            {/* Professional Greeting */}
            <Box sx={{ mb: 6, mt: 2 }}>
                <Typography variant="h3" color="primary" sx={{ mb: 1 }}>
                    Good morning, {user?.firstName || 'Teacher'}!
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={400}>
                    You have {stats?.periodsToday || 0} classes scheduled for today.
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Quick Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {[
                    { label: 'Total Students', value: stats?.totalStudents || 0, icon: <StudentsIcon />, color: '#6366f1' },
                    { label: 'Today\'s Attendance', value: '94%', icon: <AttendanceIcon />, color: '#10b981' },
                    { label: 'Pending Leaves', value: stats?.pendingLeaveRequests || 0, icon: <EventIcon />, color: '#f59e0b' },
                ].map((stat) => (
                    <Grid size={{ xs: 12, md: 4 }} key={stat.label}>
                        <AppCard sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, width: 56, height: 56 }}>
                                {stat.icon}
                            </Avatar>
                            <Box>
                                <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </AppCard>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={4}>
                {/* Main Content: Schedule & Tasks */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AppSection 
                        title="Today's Schedule"
                        action={
                            <AppButton size="small" variant="text" onClick={() => navigate('/teacher/timetable')}>
                                Full Timetable
                            </AppButton>
                        }
                    >
                        {isLoading ? (
                            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
                        ) : (
                            <Grid container spacing={2}>
                                {stats?.periodsToday ? (
                                    // Dummy data for visual representation of the redesign based on StitchMCP
                                    [
                                        { time: '09:00 AM', subject: 'Mathematics', class: 'Grade 10-A' },
                                        { time: '11:00 AM', subject: 'Algebra', class: 'Grade 9-C' },
                                    ].map((period, i) => (
                                        <Grid size={{ xs: 12, md: 6 }} key={i}>
                                            <Box sx={{ 
                                                p: 2, 
                                                borderRadius: 3, 
                                                border: '1px solid', 
                                                borderColor: 'divider',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                bgcolor: 'background.default'
                                            }}>
                                                <Typography variant="subtitle2" color="primary" fontWeight={700}>{period.time}</Typography>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={600}>{period.subject}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{period.class}</Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    ))
                                ) : (
                                    <Box sx={{ py: 4, width: '100%', textAlign: 'center' }}>
                                        <ScheduleIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                                        <Typography color="text.secondary">No classes scheduled for today</Typography>
                                    </Box>
                                )}
                            </Grid>
                        )}
                    </AppSection>

                    <AppSection title="Pending Tasks">
                        <Stack spacing={2}>
                            {[
                                { task: 'Take Attendance for 10-A', deadline: 'Today, 10:30 AM', priority: 'high' },
                                { task: 'Grade Math Assignment', deadline: 'Tomorrow', priority: 'medium' },
                            ].map((task, i) => (
                                <Box key={i} sx={{ 
                                    p: 2, 
                                    borderRadius: 3, 
                                    bgcolor: 'background.default',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Box>
                                        <Typography variant="body1" fontWeight={500}>{task.task}</Typography>
                                        <Typography variant="caption" color="text.secondary">Due: {task.deadline}</Typography>
                                    </Box>
                                    <Chip 
                                        size="small" 
                                        label={task.priority.toUpperCase()} 
                                        color={task.priority === 'high' ? 'error' : 'primary'} 
                                        variant="filled"
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </AppSection>
                </Grid>

                {/* Sidebar: Quick Actions */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Quick Actions</Typography>
                    <Stack spacing={2}>
                        <AppButton 
                            variant="contained" 
                            fullWidth 
                            size="large" 
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/teacher/homework/add')}
                            sx={{ py: 2 }}
                        >
                            Add Homework
                        </AppButton>
                        <AppButton 
                            variant="outlined" 
                            fullWidth 
                            size="large" 
                            startIcon={<ScheduleIcon />}
                            onClick={() => navigate('/teacher/exam/book')}
                            sx={{ py: 2 }}
                        >
                            Book Exam
                        </AppButton>
                        <AppButton 
                            variant="text" 
                            fullWidth 
                            size="large" 
                            startIcon={<EventIcon />}
                            onClick={() => navigate('/teacher/leave/apply')}
                            sx={{ py: 2, color: 'text.secondary' }}
                        >
                            Apply Leave
                        </AppButton>
                    </Stack>

                    <AppCard sx={{ mt: 4, p: 3, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>Teacher Support</Typography>
                        <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                            Need technical help with the platform?
                        </Typography>
                        <AppButton variant="contained" color="primary" fullWidth>
                            Open Support Ticket
                        </AppButton>
                    </AppCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeacherDashboard;
