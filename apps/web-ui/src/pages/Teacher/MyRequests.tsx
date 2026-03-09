import { useState } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DataTable from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import { useGetMyRequests } from '../../queries/Request';
import type { Request } from '../../types';
import TokenService from '../../queries/token/tokenService';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';

const MyRequestsPage = () => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const decodedToken = TokenService.decodeToken();
    const user = TokenService.getUser();
    const schoolId = decodedToken?.schoolId || '';
    const userId = decodedToken?.userId || decodedToken?.teacherId || '';
    const userType = decodedToken?.role || 'teacher';
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

    const { data, isLoading, error } = useGetMyRequests(schoolId, userId, userType);
    const requests = data?.data || [];

    const getRequestTypeLabel = (type: string) => {
        switch (type) {
            case 'email_change': return 'Email Change';
            case 'phone_change': return 'Phone Change';
            case 'signature_change': return 'Signature Change';
            default: return 'General';
        }
    };

    const columns: Column<Request>[] = [
        { id: 'requestId', label: 'ID', minWidth: 100 },
        {
            id: 'requestType',
            label: 'Request Type',
            minWidth: 120,
            format: (value) => getRequestTypeLabel(value as string),
        },
        { id: 'message', label: 'Message', minWidth: 200 },
        {
            id: 'newValue',
            label: 'Requested Value',
            minWidth: 120,
            format: (value) => value || '-',
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            format: (value) => {
                const status = value as string;
                return (
                    <Chip
                        label={status}
                        size="small"
                        color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'}
                    />
                );
            },
        },
        {
            id: 'adminReply',
            label: 'Admin Reply',
            minWidth: 200,
            format: (value) => value || '-',
        },
        {
            id: 'createdAt',
            label: 'Date',
            minWidth: 120,
            format: (value) => value ? new Date(value as string).toLocaleDateString() : '-',
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={600} color="#1e293b" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    My Requests
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                >
                    New Request
                </Button>
            </Box>

            <DataTable<Request>
                title=""
                columns={columns}
                data={requests}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load requests' : null}
                emptyMessage="You haven't submitted any requests yet."
                getRowKey={(row) => row.requestId}
            />

            <RequestChangeDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                schoolId={schoolId}
                userId={userId}
                userName={userName}
                userType={userType as "teacher" | "student" | "parent" | "sch_admin"}
            />
        </Box>
    );
};

export default MyRequestsPage;
