import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Fade,
  Checkbox,
  FormControlLabel,
  // Avatar,
  // AvatarGroup,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useLogin } from '../queries/Auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TokenService from '../queries/token/tokenService';
import { useUserStore } from '../stores/userStore';
import { useRoleStore } from '../stores/roleStore';
import { AppInput } from '../components/shared/AppInput';
import { AppButton } from '../components/shared/AppButton';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = useLogin();
  const isLoading = loginMutation.isPending;
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { fetchProfile } = useUserStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const userRole = TokenService.getRole();
      if (userRole) {
        navigate(getRedirectPath(userRole));
      }
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (loginError) setLoginError('');
  };

  const getRedirectPath = (userRole: string): string => {
    if (!userRole) return '/';
    const basePath = useRoleStore.getState().getBasePath(userRole);
    if (basePath) return `${basePath}/dashboard`;

    // Hardcoded fallback for standard roles if store is not yet initialized
    const standardPaths: Record<string, string> = {
      'super_admin': '/super-admin',
      'sch_admin': '/school-admin',
      'teacher': '/teacher',
      'student': '/student',
      'parent': '/parent',
      'driver': '/driver'
    };
    
    const fallback = standardPaths[userRole] || "";
    if (fallback) return `${fallback}/dashboard`;
    
    return '/';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: LoginErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    loginMutation.mutate({ ...formData, rememberMe }, {
      onSuccess: async (res: any) => {
        if (res?.data?.token) {
          login(res.data.token);
          await fetchProfile();
          const userRole = TokenService.getRole();
          const redirectPath = getRedirectPath(userRole || 'super_admin');
          navigate(redirectPath);
        } else {
          setLoginError("Invalid server response - no token received");
        }
      },
      onError: (err: any) => {
        setLoginError(err?.response?.data?.message || "Login failed. Please check credentials.");
      },
    });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Left Side: Branding & Social Proof */}
      <Box sx={{
        flex: 1,
        display: { xs: 'none', md: 'flex' },
        bgcolor: '#EEF2FF',
        position: 'relative',
        flexDirection: 'column',
        p: 8,
        backgroundImage: `radial-gradient(#C7D2FE 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        overflow: 'hidden'
      }}>
        {/* Background Image Layer */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/bg_singin.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.4,
            zIndex: 0,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 10 }}>
            <Box sx={{
              bgcolor: 'primary.main',
              p: 1,
              borderRadius: 2,
              display: 'flex',
              boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)'
            }}>
              <SchoolIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
              SMS Edu Solution
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ maxWidth: 500, my: 'auto' }}>
            <Typography variant="h1" sx={{
              fontSize: '3.5rem',
              fontWeight: 800,
              lineHeight: 1.1,
              mb: 3,
              color: '#1E293B'
            }}>
              Elevate Your School's Potential.
            </Typography>
            <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 400, mb: 6, lineHeight: 1.6 }}>
              The all-in-one solution for modern school management. Streamline your administrative tasks, track student progress, and engage parents effortlessly.
            </Typography>
          </Box>

          {/* Social Proof Card */}
          {/* <Box sx={{
            bgcolor: 'white',
            p: 2.5,
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            width: 'fit-content',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mt: 'auto'
          }}>
            <AvatarGroup max={4}>
              <Avatar src="https://i.pravatar.cc/150?u=1" />
              <Avatar src="https://i.pravatar.cc/150?u=2" />
              <Avatar src="https://i.pravatar.cc/150?u=3" />
              <Avatar sx={{ bgcolor: 'secondary.main', fontSize: 13 }}>+12k</Avatar>
            </AvatarGroup>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              Joined by over 12,000 educators worldwide.
            </Typography>
          </Box> */}
        </Box>
      </Box>

      {/* Right Side: Login Form */}
      <Box sx={{
        width: { xs: '100%', md: '550px', lg: '650px' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'white'
      }}>
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 4, sm: 8 }
        }}>
          <Fade in timeout={1000}>
            <Box sx={{ maxWidth: 450, width: '100%' }}>
              <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, color: '#1E293B' }}>
                  Welcome Back
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B' }}>
                  Enter your credentials to access your dashboard
                </Typography>
              </Box>

              <form onSubmit={handleSubmit}>
                {loginError && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{loginError}</Alert>}

                <AppInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  placeholder="name@school.edu"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ fontSize: 20, color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ position: 'relative' }}>
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 4,
                      zIndex: 1,
                      cursor: 'pointer',
                      fontWeight: 700,
                      '&:hover': { opacity: 0.8 }
                    }}
                    onClick={() => navigate('/forgot-password')}
                  >
                    Forgot Password?
                  </Typography>
                  <AppInput
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    placeholder="••••••••"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ fontSize: 20, color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94A3B8' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Remember me for 30 days
                    </Typography>
                  }
                  sx={{ mb: 4, mt: 1 }}
                />

                <AppButton
                  fullWidth
                  type="submit"
                  variant="contained"
                  loading={isLoading}
                  size="large"
                  sx={{ py: 2, fontSize: '1.1rem', fontWeight: 700, textTransform: 'none', borderRadius: 3 }}
                >
                  Sign In
                </AppButton>

                <Divider sx={{ my: 4 }}>
                  <Typography variant="caption" sx={{ px: 2, color: '#94A3B8', fontWeight: 600 }}>
                    Other Access
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    Don't have an account? <Typography
                      variant="body2"
                      component="span"
                      color="primary"
                      sx={{ fontWeight: 700, cursor: 'pointer' }}
                    >
                      Contact Admin
                    </Typography>
                  </Typography>
                </Box>
              </form>
            </Box>
          </Fade>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', gap: 4 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
            SUPPORT
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
            PRIVACY
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
            TERMS
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;