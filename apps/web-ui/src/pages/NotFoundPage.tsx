import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppButton } from '../components/shared/AppButton';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F8FAFC',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(#C7D2FE 1.5px, transparent 1.5px)`,
          backgroundSize: '36px 36px',
          opacity: 0.5,
          zIndex: 0,
        }
      }}
    >
      {/* Floating Decorative Elements */}
      <Box
        component={motion.div}
        animate={{
          y: [0, -25, 0],
          rotate: [0, 15, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        sx={{
          position: 'absolute',
          top: '20%',
          left: '12%',
          opacity: 0.35,
          fontSize: '4.5rem',
          zIndex: 0,
          filter: 'blur(0.5px)'
        }}
      >
        📚
      </Box>
      <Box
        component={motion.div}
        animate={{
          y: [0, 25, 0],
          rotate: [0, -20, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          opacity: 0.35,
          fontSize: '5rem',
          zIndex: 0,
          filter: 'blur(0.5px)'
        }}
      >
        ✏️
      </Box>
      <Box
        component={motion.div}
        animate={{
          x: [0, 15, 0],
          y: [0, -10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        sx={{ position: 'absolute', top: '10%', right: '20%', opacity: 0.25, fontSize: '2.5rem', zIndex: 0 }}
      >
        📏
      </Box>
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        sx={{ position: 'absolute', bottom: '10%', left: '15%', opacity: 0.25, fontSize: '3rem', zIndex: 0 }}
      >
        🎓
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, width: '100%' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '8rem', md: '14rem' },
                fontWeight: 900,
                color: 'primary.main',
                lineHeight: 1,
                opacity: 0.08,
                userSelect: 'none',
                letterSpacing: '-0.05em'
              }}
            >
              404
            </Typography>
          </Box>

          {/* Illustration Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}
          >
            <Box
              component={motion.img}
              src="/not_found-bell.png"
              alt="404 Illustration"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              sx={{
                width: '100%',
                maxWidth: 400,
                height: 'auto',
                filter: 'drop-shadow(0 20px 30px rgba(99, 102, 241, 0.2))'
              }}
            />
          </motion.div>

          {/* Message Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1E293B',
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              Not Found
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#64748B',
                fontWeight: 400,
                mb: 6,
                lineHeight: 1.6,
                maxWidth: 450,
                mx: 'auto'
              }}
            >
              Oops! This page seems to be missing. Perhaps it was moved to a different wing of the school?
            </Typography>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <AppButton
                variant="outlined"
                color="primary"
                onClick={() => navigate(-1)}
                sx={{ px: 4, py: 1.5, minWidth: 150 }}
              >
                Go Back
              </AppButton>
              <AppButton
                variant="contained"
                color="primary"
                onClick={() => navigate('/')}
                sx={{ px: 4, py: 1.5, minWidth: 150 }}
              >
                Go Home
              </AppButton>
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFoundPage;
