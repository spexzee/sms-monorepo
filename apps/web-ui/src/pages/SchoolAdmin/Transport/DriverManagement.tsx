import React, { useState } from 'react';
import { Box, Typography, Tooltip, IconButton, Avatar, Chip } from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import TokenService from '../../../queries/token/tokenService';
import { useGetDrivers, useDeleteDriver } from '../../../queries/transport';
import { useNotification } from '../../../hooks/useNotification';
import DataTable, { type Column } from '../../../components/Table/DataTable';
import AddDriverDialog from '../../../components/Dialogs/AddDriverDialog';
import ConfirmationDialog from '../../../components/Dialogs/ConfirmationDialog';

const DriverManagement: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [deleteData, setDeleteData] = useState<{id: string, name: string} | null>(null);

    const schoolId = TokenService.getSchoolId() || '';
    const { data: driversRes, isLoading } = useGetDrivers(schoolId);
    const drivers = driversRes?.data || [];
    const deleteMutation = useDeleteDriver(schoolId);
    const notification = useNotification();

    const handleOpen = (driver: any = null) => {
        setSelectedDriver(driver);
        setOpen(true);
    };

    const handleDeleteClick = (id: string, name: string) => {
        setDeleteData({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteData) return;
        try {
            await deleteMutation.mutateAsync(deleteData.id);
            notification.success("Driver deleted successfully");
        } catch (err: any) {
            notification.error(err?.message || "Failed to delete driver");
        } finally {
            setDeleteData(null);
        }
    };

    const isLicenseExpiringSoon = (dateStr: any) => {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        const diff = (expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diff < 15;
    };

    const columns: Column<any>[] = [
        {
            id: 'firstName',
            label: 'Driver Name',
            minWidth: 250,
            format: (_, row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                    <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', fontWeight: 700 }}>
                        {row.firstName?.[0]}{row.lastName?.[0]}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.firstName} {row.lastName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.email}</Typography>
                    </Box>
                </Box>
            )
        },
        {
            id: 'driverId',
            label: 'ID',
            minWidth: 120,
            format: (val) => (
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'primary.main' }}>
                    {val}
                </Typography>
            )
        },
        {
            id: 'phone',
            label: 'Contact',
            minWidth: 150,
            format: (val) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant="body2">{val || 'N/A'}</Typography>
                </Box>
            )
        },
        {
            id: 'licenseNumber',
            label: 'License Info',
            minWidth: 200,
            format: (val, row) => (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BadgeIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="body2">{val}</Typography>
                    </Box>
                    {row.licenseExpiry && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <Typography variant="caption" color={isLicenseExpiringSoon(row.licenseExpiry) ? 'error' : 'textSecondary'}>
                                Expires: {new Date(row.licenseExpiry).toLocaleDateString()}
                            </Typography>
                            {isLicenseExpiringSoon(row.licenseExpiry) && (
                                <WarningIcon sx={{ color: 'error.main', fontSize: '0.85rem' }} />
                            )}
                        </Box>
                    )}
                </Box>
            )
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 120,
            format: (val) => (
                <Chip
                    label={val}
                    size="small"
                    variant="outlined"
                    sx={{
                        borderRadius: '8px', fontWeight: 700, textTransform: 'capitalize',
                        borderColor: val === 'active' ? 'success.main' : 'error.main',
                        color: val === 'active' ? 'success.main' : 'error.main'
                    }}
                />
            )
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 120,
            align: 'right',
            format: (_, row) => (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="Edit Profile">
                        <IconButton size="small" onClick={() => handleOpen(row)} color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => handleDeleteClick(row.driverId, `${row.firstName} ${row.lastName}`)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <DataTable
                title="Driver Management"
                columns={columns}
                data={drivers}
                isLoading={isLoading}
                onAddClick={() => handleOpen()}
                addButtonLabel="Add New Driver"
                emptyMessage="No drivers found. Manage your transport staff here."
                renderHeaderActions={() => (
                    <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                        Maintain driver credentials, licenses, and availability.
                    </Typography>
                )}
            />

            <AddDriverDialog
                open={open}
                onClose={() => setOpen(false)}
                schoolId={schoolId}
                editData={selectedDriver}
            />

            <ConfirmationDialog 
                open={!!deleteData}
                onClose={() => setDeleteData(null)}
                onConfirm={confirmDelete}
                title="Delete Driver"
                description={`Are you sure you want to delete ${deleteData?.name || 'this driver'}? This will remove their system access.`}
                confirmLabel="Delete"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </Box>
    );
};

export default DriverManagement;
