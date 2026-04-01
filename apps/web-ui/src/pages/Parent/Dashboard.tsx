import React from 'react';
import { Box, Typography, Grid, Avatar, Chip, Skeleton, Alert, Stack } from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    Announcement as AnnouncementIcon,
    AccessTime as AccessTimeIcon,
    // Payments as PaymentsIcon,
    // Chat as ChatIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TokenService from '../../queries/token/tokenService';
import { useGetParentDashboard } from '../../queries/ParentPortal';
import { useGetAnnouncements } from '../../queries/Announcement';
import { useGetUpcomingHomework } from '../../queries/Homework';
import { useChildSelector } from '../../context/ChildSelectorContext';
import type { ChildStats, Announcement, Homework } from '../../types';
import { AppCard } from '../../components/shared/AppCard';
import { AppButton } from '../../components/shared/AppButton';
import { AppSection } from '../../components/shared/AppSection';

const ParentDashboard = () => {
    const navigate = useNavigate();
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild } = useChildSelector();

    const { data: dashboardData, isLoading: loadingDashboard, error } = useGetParentDashboard(schoolId);
    const { data: announcementsData, isLoading: loadingAnnouncements } = useGetAnnouncements(schoolId, { limit: 3 });
    const { data: homeworkData, isLoading: loadingHomework } = useGetUpcomingHomework(
        schoolId,
        selectedChild?.studentId || '',
        5
    );

    const dashboard = dashboardData?.data;
    const announcements = announcementsData?.data || [];
    const upcomingHomework = homeworkData?.data || [];

    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'warning';
        return 'error';
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load dashboard data. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            {/* Header with improved typography */}
            <Box sx={{ mb: { xs: 4, md: 6 }, mt: 2 }}>
                {loadingDashboard ? (
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
                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '2rem', md: '3rem' }
                            }}
                        >
                            Welcome, {dashboard?.parentName || `${user?.firstName} ${user?.lastName}`}!
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ opacity: 0.8 }}>
                            Hope your children are having a great day.
                        </Typography>
                    </>
                )}
            </Box>

            <Grid container spacing={4}>
                {/* Children Overview Section */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AppSection
                        title="My Children"
                        action={
                            <AppButton size="small" variant="text" onClick={() => navigate('/parent/children')}>
                                View All
                            </AppButton>
                        }
                    >
                        <Grid container spacing={3}>
                            {loadingDashboard ? (
                                [1, 2].map((i) => (
                                    <Grid size={{ xs: 12, md: 6 }} key={i}>
                                        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 4 }} />
                                    </Grid>
                                ))
                            ) : (
                                dashboard?.children?.map((child: ChildStats) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={child.studentId}>
                                        <AppCard
                                            onClick={() => navigate(`/parent/children/${child.studentId}`)}
                                            sx={{
                                                p: { xs: 2, sm: 3 },
                                                borderRadius: 4,
                                                backdropFilter: 'blur(10px)',
                                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                                border: '1px solid',
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 2.5 }, alignItems: 'center' }}>
                                                <Avatar
                                                    src={child.profileImage}
                                                    alt={child.name}
                                                    sx={{
                                                        width: { xs: 60, sm: 80 },
                                                        height: { xs: 60, sm: 80 },
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                        border: '3px solid #fff'
                                                    }}
                                                >
                                                    {child.firstName?.[0]}
                                                </Avatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="h6" fontWeight={700} noWrap sx={{ mb: 0.1 }}>
                                                        {child.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, opacity: 0.8 }}>
                                                        Grade {child.className}-{child.sectionName} • Roll No: {child.rollNumber}
                                                    </Typography>

                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        <Chip
                                                            size="small"
                                                            label={`${child.attendancePercentage}% Attendance`}
                                                            color={getAttendanceColor(child.attendancePercentage)}
                                                            sx={{ borderRadius: 1.5, fontWeight: 600 }}
                                                        />
                                                        {child.pendingLeaves > 0 && (
                                                            <Chip
                                                                size="small"
                                                                label={`${child.pendingLeaves} Leave Pending`}
                                                                color="warning"
                                                                variant="outlined"
                                                                sx={{ borderRadius: 1.5, fontWeight: 600, bgcolor: 'warning.light', color: 'warning.dark', border: 'none' }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </AppCard>
                                    </Grid>
                                ))
                            )}
                        </Grid>
                    </AppSection>

                    {/* Schedule and Notices */}
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <AppSection title="Upcoming Homework">
                                {loadingHomework ? (
                                    <Skeleton variant="rectangular" height={200} />
                                ) : upcomingHomework.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                                        <Typography color="text.secondary">No pending homework today</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={2}>
                                        {upcomingHomework.slice(0, 3).map((hw: Homework) => (
                                            <Box key={hw.homeworkId} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                                <Typography variant="subtitle2" fontWeight={600}>{hw.title}</Typography>
                                                <Typography variant="caption" color="text.secondary">{hw.subjectName} • Due {new Date(hw.dueDate).toLocaleDateString()}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </AppSection>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <AppSection title="Announcements">
                                {loadingAnnouncements ? (
                                    <Skeleton variant="rectangular" height={200} />
                                ) : announcements.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <AnnouncementIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                                        <Typography color="text.secondary">No new announcements</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={2}>
                                        {announcements.slice(0, 3).map((ann: Announcement) => (
                                            <Box key={ann.announcementId} sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                bgcolor: ann.priority === 'urgent' ? 'error.light' : 'background.default',
                                                borderLeft: 4,
                                                borderColor: ann.priority === 'urgent' ? 'error.main' : 'primary.main'
                                            }}>
                                                <Typography variant="subtitle2" fontWeight={600}>{ann.title}</Typography>
                                                <Typography variant="caption" display="block">{ann.category} • {new Date(ann.publishDate).toLocaleDateString()}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </AppSection>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Quick Actions Sidebar */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Quick Actions</Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Apply Leave', icon: <AccessTimeIcon />, path: '/parent/leave/apply', color: '#f59e0b' },
                            { label: 'View Results', icon: <SchoolIcon />, path: '/parent/results', color: '#10b981' },
                            // { label: 'Pay Fees', icon: <PaymentsIcon />, path: '/parent/fees', color: '#6366f1' },
                            // { label: 'Message Teacher', icon: <ChatIcon />, path: '/parent/messages', color: '#ec4899' },
                        ].map((action) => (
                            <Grid size={{ xs: 6 }} key={action.label}>
                                <AppCard
                                    sx={{
                                        py: 3,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        height: '100%',
                                        borderRadius: 4,
                                        backdropFilter: 'blur(8px)',
                                        bgcolor: 'rgba(255,255,255,0.6)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => navigate(action.path)}
                                >
                                    <Avatar sx={{ bgcolor: `${action.color}15`, color: action.color, mb: 2, mx: 'auto', width: 56, height: 56, border: '1px solid', borderColor: `${action.color}30` }}>
                                        {React.cloneElement(action.icon as any, { sx: { fontSize: 28 } })}
                                    </Avatar>
                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">{action.label}</Typography>
                                </AppCard>
                            </Grid>
                        ))}
                    </Grid>

                    <AppCard sx={{ mt: 4, p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>Need help?</Typography>
                        <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                            Our administration department is here to assist you with any queries.
                        </Typography>
                        <AppButton variant="contained" color="secondary" fullWidth startIcon={<PersonIcon />}>
                            Contact Helpline
                        </AppButton>
                    </AppCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ParentDashboard;
