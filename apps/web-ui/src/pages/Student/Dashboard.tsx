import React from 'react';
import { Box, Typography, Grid, Skeleton, Alert, Avatar } from '@mui/material';
import {
    School as ClassIcon,
    Assessment as ResultsIcon,
    EventNote as LeaveIcon,
    CheckCircle as AttendanceIcon,
    Schedule as TimetableIcon,
    Help as RequestIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppCard } from '../../components/ui/AppCard';
import TokenService from '../../queries/token/tokenService';
import { useGetSimpleStudentAttendance } from '../../queries/Attendance';

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = TokenService.getUser();
    const userName = `${user?.firstName} ${user?.lastName}`;
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';

    // Get last 30 days of attendance
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: attendanceData, isLoading, error } = useGetSimpleStudentAttendance(
        schoolId,
        studentId,
        startDate,
        endDate
    );

    const summary = attendanceData?.data?.summary;
    const totalDays = summary?.total || 0;
    const presentDays = (summary?.present || 0) + (summary?.late || 0);
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(0) : 0;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Welcome Header with improved typography */}
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
                                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '2.25rem', md: '3rem' }
                            }}
                        >
                            Welcome, {userName}!
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ opacity: 0.8 }}>
                            Here's your academic overview for today.
                        </Typography>
                    </>
                )}
            </Box>

            {/* Removed CircularProgress as we now use Skeletons in the grid */}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Dashboard Grid */}
            <Grid container spacing={3}>
                {isLoading ? (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))
                ) : (
                    [
                        { title: 'My Attendance', value: `${percentage}%`, subtitle: `${presentDays} of ${totalDays} days present`, icon: <AttendanceIcon />, color: '#10b981', to: '/student/attendance' },
                        { title: 'Timetable', value: summary?.total || '-', subtitle: 'School days this month', icon: <TimetableIcon />, color: '#3b82f6', to: '/student/timetable' },
                        { title: 'My Exams', value: summary?.absent || 0, subtitle: 'Days absent this month', icon: <ResultsIcon />, color: '#8b5cf6', to: '/student/exam/my-exams' },
                        { title: 'Leave Requests', value: summary?.leave || 0, subtitle: 'Days on leave', icon: <LeaveIcon />, color: '#f59e0b', to: '/student/leave/apply' },
                        { title: 'My Requests', value: summary?.late || 0, subtitle: 'Days late this month', icon: <RequestIcon />, color: '#ec4899', to: '/student/my-requests' },
                        { title: 'My Profile', value: presentDays, subtitle: 'Days present this month', icon: <ClassIcon />, color: '#06b6d4', to: '/student/profile' },
                    ].map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title}>
                        <AppCard 
                            onClick={() => navigate(item.to)}
                            sx={{ 
                                p: 3, 
                                height: '100%',
                                borderRadius: 4,
                                backdropFilter: 'blur(10px)',
                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: 48, height: 48, borderRadius: 2 }}>
                                    {React.cloneElement(item.icon as any, { sx: { fontSize: 24 } })}
                                </Avatar>
                            </Box>
                            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>{item.value}</Typography>
                            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>{item.title}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>{item.subtitle}</Typography>
                        </AppCard>
                    </Grid>
                ))
            )}
            </Grid>
        </Box>
    );
};

export default StudentDashboard;
