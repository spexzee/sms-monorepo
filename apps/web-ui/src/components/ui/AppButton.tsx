import React from 'react';
import { Button, type ButtonProps, CircularProgress } from '@mui/material';
import { motion, type HTMLMotionProps } from 'framer-motion';

const MotionButton = motion(Button);

// We need to omit some props that conflict between MUI and Framer Motion
type MergedButtonProps = Omit<HTMLMotionProps<'button'>, keyof ButtonProps> & ButtonProps;

interface AppButtonProps extends MergedButtonProps {
  loading?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({ 
  children, 
  loading, 
  disabled, 
  startIcon, 
  sx, 
  ...props 
}) => {
  return (
    <MotionButton
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      disabled={loading || disabled}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        px: 3,
        py: 1,
        ...sx
      }}
      {...props as any}
    >
      {children}
    </MotionButton>
  );
};
