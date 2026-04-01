import React from 'react';
import { Box, Typography, Grid, Avatar, Stack, Skeleton, Alert, Chip } from '@mui/material';
import { format } from 'date-fns';
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
import { AppCard } from '../../components/shared/AppCard';
import { AppButton } from '../../components/shared/AppButton';
import { AppSection } from '../../components/shared/AppSection';

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId() || '';

    const { data, isLoading, error } = useGetTeacherDashboardStats(schoolId);
    const stats = data?.data;

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            {/* Professional Greeting with improved typography */}
            <Box sx={{ mb: { xs: 4, md: 6 }, mt: 2 }}>
                {isLoading ? (
                    <>
                        <Skeleton variant="text" width="60%" height={80} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
                    </>
                ) : (
                    <>
                        <Typography
                            variant="h3"
                            fontWeight={800}
                            sx={{
                                mb: 1,
                                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '2.25rem', md: '3rem' }
                            }}
                        >
                            Good morning, {user?.firstName || 'Teacher'}!
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ opacity: 0.8 }}>
                            You have {stats?.periodsToday || 0} classes scheduled for today.
                        </Typography>
                    </>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Quick Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 6 }} component="div">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i} component="div">
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))
                ) : (
                    [
                        { label: 'Total Students', value: stats?.totalStudents || 0, icon: <StudentsIcon />, color: '#6366f1' },
                        { label: 'Today\'s Attendance', value: stats?.attendancePercentage || '0%', icon: <AttendanceIcon />, color: '#10b981' },
                        { label: 'Pending Leaves', value: stats?.pendingLeaveRequests || 0, icon: <EventIcon />, color: '#f59e0b' },
                    ].map((stat) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.label} component="div">
                            <AppCard sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                p: 3,
                                borderRadius: 4,
                                backdropFilter: 'blur(10px)',
                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
                            }}>
                                <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, width: 56, height: 56, border: '1px solid', borderColor: `${stat.color}20` }}>
                                    {stat.icon}
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight={800}>{stat.value}</Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{stat.label}</Typography>
                                </Box>
                            </AppCard>
                        </Grid>
                    ))
                )}
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
                                {stats?.todaySchedule && stats.todaySchedule.length > 0 ? (
                                    stats.todaySchedule.map((period, i) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                            <Box sx={{
                                                p: 2.5,
                                                borderRadius: 4,
                                                border: '1px solid',
                                                borderColor: 'rgba(255, 255, 255, 0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                bgcolor: 'rgba(255, 255, 255, 0.5)',
                                                backdropFilter: 'blur(4px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 8px 16px rgba(0,0,0,0.06)'
                                                }
                                            }}>
                                                <Box sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: 'primary.light',
                                                    color: 'primary.dark',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    minWidth: 100,
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.9rem', opacity: 0.8 }}>
                                                        {'Period'} <b>#{period.periodNumber}</b>
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={700} sx={{ mt: 0.5, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                        {period.time}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">{period.subject}</Typography>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>{period.class}</Typography>
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
                            {isLoading ? (
                                [1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={70} sx={{ borderRadius: 3 }} />)
                            ) : stats?.pendingTasks && stats.pendingTasks.length > 0 ? (
                                stats.pendingTasks.map((task, i) => (
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
                                            <Typography variant="caption" color="text.secondary">
                                                Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={task.priority.toUpperCase()}
                                            color={task.priority === 'high' ? 'error' : 'primary'}
                                            variant="filled"
                                        />
                                    </Box>
                                ))
                            ) : (
                                <Box sx={{ py: 3, textAlign: 'center', opacity: 0.6 }}>
                                    <Typography variant="body2">No pending tasks</Typography>
                                </Box>
                            )}
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
