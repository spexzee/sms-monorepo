import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Button, Paper, Card, CardContent, 
    Avatar, Chip, Grid, List, ListItem, ListItemText, 
    ListItemIcon, Divider, CircularProgress, Alert
} from '@mui/material';
import { 
    PlayArrow as StartIcon, Stop as StopIcon, 
    MyLocation as GpsIcon
} from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import TokenService from '../../queries/token/tokenService';

const TRANSPORT_API = "http://localhost:5004/api/transport";
const SOCKET_URL = "http://localhost:5004";

const DriverDashboard: React.FC = () => {
    const [isTripActive, setIsTripActive] = useState(false);
    const [currentRoute, setCurrentRoute] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId();

    useEffect(() => {
        const fetchAssignedRoute = async () => {
            try {
                // Fetch route assigned to this driver
                const res = await axios.get(`${TRANSPORT_API}/school/${schoolId}/routes`);
                const assigned = res.data.data.find((r: any) => 
                    user && (r.driverId === user.userId || r.driver?.userId === user.userId)
                );
                setCurrentRoute(assigned);
            } catch (err) {
                console.error("Failed to fetch assigned route:", err);
            } finally {
                setLoading(false);
            }
        };

        if (schoolId) {
            fetchAssignedRoute();
        }

        // Initialize Socket
        socketRef.current = io(SOCKET_URL);
        
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [schoolId, user]);

    const handleStartTrip = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsTripActive(true);
        
        // Start watching position
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, heading } = position.coords;
                
                // Emit location update via websocket
                if (socketRef.current && currentRoute) {
                    socketRef.current.emit('updateLocation', {
                        routeId: currentRoute.routeId,
                        location: { latitude, longitude },
                        heading: heading || 0,
                        driverId: user?.userId
                    });
                }
            },
            (err) => console.error(err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
    };

    const handleStopTrip = () => {
        setIsTripActive(false);
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: { xs: 2, sm: 4 }, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', minHeight: '100vh' }}>
            <Grid container spacing={4}>
                {/* Profile Header */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', display: 'flex', alignItems: 'center', gap: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                            {user?.firstName?.[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>Welcome, {user?.firstName}!</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Chip label="Verified Driver" color="success" size="small" sx={{ fontWeight: 700 }} />
                                <Chip label={isTripActive ? "On Duty" : "Off Duty"} color={isTripActive ? "primary" : "default"} size="small" />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Trip Control Card */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{ borderRadius: '24px', height: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Active Trip Control</Typography>
                            
                            {!currentRoute ? (
                                <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                                    No route currently assigned to you. Please contact administration.
                                </Alert>
                            ) : (
                                <Box>
                                    <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>CURRENT ASSIGNMENT</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>{currentRoute.name}</Typography>
                                        <Typography variant="body1" color="textSecondary">Vehicle: {currentRoute.vehicle?.name || "Bus 12"} ({currentRoute.vehicle?.plateNumber || "KA05LS7929"})</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        {!isTripActive ? (
                                            <Button 
                                                variant="contained" 
                                                fullWidth 
                                                size="large"
                                                startIcon={<StartIcon />}
                                                onClick={handleStartTrip}
                                                sx={{ py: 2, borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700, textTransform: 'none', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' }}
                                            >
                                                Start Trip / Check-In
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="contained" 
                                                color="error"
                                                fullWidth 
                                                size="large"
                                                startIcon={<StopIcon />}
                                                onClick={handleStopTrip}
                                                sx={{ py: 2, borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700, textTransform: 'none' }}
                                            >
                                                End Trip / Check-Out
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Route Details */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Route Schedule</Typography>
                            {currentRoute?.stops ? (
                                <List>
                                    {currentRoute.stops.map((stop: any, idx: number) => (
                                        <React.Fragment key={idx}>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemIcon>
                                                    <Box sx={{ 
                                                        width: 32, height: 32, borderRadius: '50%', 
                                                        bgcolor: idx === 0 ? 'primary.main' : 'rgba(0,0,0,0.05)', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: idx === 0 ? 'white' : 'text.primary',
                                                        fontWeight: 700
                                                    }}>
                                                        {idx + 1}
                                                    </Box>
                                                </ListItemIcon>
                                                <ListItemText 
                                                    primary={stop.name} 
                                                    secondary={`Scheduled: ${stop.arrivalTime || '08:00 AM'}`}
                                                    primaryTypographyProps={{ fontWeight: 700 }}
                                                />
                                                <Chip label="On Time" size="small" variant="outlined" color="success" />
                                            </ListItem>
                                            {idx < currentRoute.stops.length - 1 && <Divider variant="inset" component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Typography color="textSecondary">No stops information available.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Bar */}
                {isTripActive && (
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 2, borderRadius: '16px', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <GpsIcon className="animate-pulse" />
                                <Typography sx={{ fontWeight: 700 }}>GPS Tracking Active - Parents are being notified of your location</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Last Update: {new Date().toLocaleTimeString()}</Typography>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default DriverDashboard;
