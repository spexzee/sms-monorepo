// apps/web-ui/src/pages/SchoolAdmin/Fees/Dashboard/index.tsx

import React from 'react';
import { Box, Grid, Typography, Card, CardContent, Button, Stack, LinearProgress, Skeleton } from '@mui/material';
import { Link } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TodayIcon from '@mui/icons-material/Today';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TokenService from '../../../../queries/token/tokenService';
import {
    useGetFeeDashboardStats,
    useGetPayments,
    useGetClasswiseCollectionReport,
    useGetTodayCollectionReport
} from '../../../../queries/Fee';
import { AppTable } from '../../../../components/shared/AppTable';

const FeeDashboard: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data: statsData, isLoading: isLoadingStats } = useGetFeeDashboardStats(schoolId);
    const { data: paymentsData, isLoading: isLoadingPayments } = useGetPayments(schoolId, { limit: 5 });
    const { data: classwiseData } = useGetClasswiseCollectionReport(schoolId);
    const { data: todayCollectionData } = useGetTodayCollectionReport(schoolId);

    const stats = statsData?.data;
    const recentPayments = paymentsData?.data || [];
    const classwiseStats = classwiseData?.data || [];
    const todayMethods = todayCollectionData?.data || [];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    // Columns for recent payments
    const columns = [
        {
            name: 'Transaction ID',
            selector: (row: any) => row.transactionId,
            cell: (row: any) => (
                <Typography variant="body2" fontWeight={600} color="primary">
                    {row.transactionId}
                </Typography>
            )
        },
        {
            name: 'Student Name',
            selector: (row: any) => row.studentName,
        },
        {
            name: 'Academic Year',
            selector: (row: any) => row.academicYear,
        },
        {
            name: 'Date',
            selector: (row: any) => new Date(row.paymentDate).toLocaleDateString(),
        },
        {
            name: 'Mode',
            selector: (row: any) => row.paymentMode?.toUpperCase(),
        },
        {
            name: 'Amount',
            selector: (row: any) => row.amount,
            cell: (row: any) => (
                <Typography variant="body2" fontWeight={700} color="success.main">
                    {formatCurrency(row.amount)}
                </Typography>
            )
        }
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                        Fees Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Real-time oversight of collections, dues, and transaction histories.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
                    <Button variant="contained" color="primary" component={Link} to="/school-admin/fees/payments" startIcon={<ReceiptIcon />} sx={{ borderRadius: 2 }}>
                        Collect Payment
                    </Button>
                    <Button variant="outlined" color="primary" component={Link} to="/school-admin/fees/assignments" startIcon={<AssignmentIcon />} sx={{ borderRadius: 2 }}>
                        Assign Fees
                    </Button>
                </Stack>
            </Box>

            {/* Statistics Cards Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 3, color: '#3b82f6', display: 'flex' }}>
                                <AccountBalanceWalletIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>Total Collected</Typography>
                                {isLoadingStats ? <Skeleton width={100} height={32} /> : (
                                    <Typography variant="h5" fontWeight={700} color="#1e293b">
                                        {formatCurrency(stats?.totalCollected || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 3, color: '#22c55e', display: 'flex' }}>
                                <TodayIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>Today's Collection</Typography>
                                {isLoadingStats ? <Skeleton width={100} height={32} /> : (
                                    <Typography variant="h5" fontWeight={700} color="#1e293b">
                                        {formatCurrency(stats?.todayCollection || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 3, color: '#ef4444', display: 'flex' }}>
                                <HourglassEmptyIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>Pending Amount</Typography>
                                {isLoadingStats ? <Skeleton width={100} height={32} /> : (
                                    <Typography variant="h5" fontWeight={700} color="#1e293b">
                                        {formatCurrency(stats?.totalOutstanding || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: '#faf5ff', borderRadius: 3, color: '#a855f7', display: 'flex' }}>
                                <PeopleIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>Students with Dues</Typography>
                                {isLoadingStats ? <Skeleton width={100} height={32} /> : (
                                    <Typography variant="h5" fontWeight={700} color="#1e293b">
                                        {stats?.totalStudentsWithDues || 0}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Actions & CSS Visual Analytics Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Collection By Class (Horizontal list) */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 3 }}>
                                Collections By Class
                            </Typography>
                            <Stack spacing={2.5}>
                                {classwiseStats.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">No structure assignments recorded yet.</Typography>
                                ) : (
                                    classwiseStats.slice(0, 5).map((item: any) => {
                                        const percent = item.totalExpected > 0 ? (item.totalCollected / item.totalExpected) * 100 : 0;
                                        return (
                                            <Box key={item._id}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="body2" fontWeight={600} color="text.primary">{item.className}</Typography>
                                                    <Typography variant="body2" fontWeight={700} color="text.secondary">
                                                        {formatCurrency(item.totalCollected)} / {formatCurrency(item.totalExpected)} ({Math.round(percent)}%)
                                                    </Typography>
                                                </Box>
                                                <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9' }} />
                                            </Box>
                                        );
                                    })
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Payment Methods Breakdown */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 3 }}>
                                Collection Method Distribution
                            </Typography>
                            <Stack spacing={2.5}>
                                {todayMethods.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">No payments collected today.</Typography>
                                    </Box>
                                ) : (
                                    todayMethods.map((item: any, idx: number) => {
                                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                                        const color = colors[idx % colors.length];
                                        return (
                                            <Box key={item._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
                                                    <Typography variant="body2" fontWeight={600} color="text.primary">
                                                        {item._id?.toUpperCase()}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" fontWeight={700} color="#1e293b">
                                                    {formatCurrency(item.total)} ({item.count} txns)
                                                </Typography>
                                            </Box>
                                        );
                                    })
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Payments Table */}
            <Card sx={{ borderRadius: 4, border: '1px solid #f1f5f9', boxShadow: 'none', mb: 4 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={700} color="#1e293b">
                            Recent Payments
                        </Typography>
                        <Button variant="text" size="small" component={Link} to="/school-admin/fees/receipts" startIcon={<AssessmentIcon />}>
                            View All Receipts
                        </Button>
                    </Box>
                    <AppTable
                        columns={columns}
                        data={recentPayments}
                        isLoading={isLoadingPayments}
                        emptyMessage="No payments logged in the system yet."
                    />
                </CardContent>
            </Card>

            {/* Quick Action Navigation Grid */}
            <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
                Quick Action Panel
            </Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Button variant="outlined" fullWidth component={Link} to="/school-admin/fees/categories" startIcon={<SettingsIcon />} sx={{ py: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, borderColor: '#e2e8f0', color: '#475569' }}>
                        Fee Categories
                    </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Button variant="outlined" fullWidth component={Link} to="/school-admin/fees/structures" startIcon={<SettingsIcon />} sx={{ py: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, borderColor: '#e2e8f0', color: '#475569' }}>
                        Fee Structures
                    </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Button variant="outlined" fullWidth component={Link} to="/school-admin/fees/accounts" startIcon={<PeopleIcon />} sx={{ py: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, borderColor: '#e2e8f0', color: '#475569' }}>
                        Student Ledgers
                    </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Button variant="outlined" fullWidth component={Link} to="/school-admin/fees/reports" startIcon={<AssessmentIcon />} sx={{ py: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, borderColor: '#e2e8f0', color: '#475569' }}>
                        Collection Reports
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FeeDashboard;
