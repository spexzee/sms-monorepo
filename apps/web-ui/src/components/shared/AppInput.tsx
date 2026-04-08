import React from 'react';
import { TextField, type TextFieldProps, alpha, Typography, Box } from '@mui/material';

export type AppInputProps = TextFieldProps & {
  labelHint?: string;
  textFieldSx?: any;
};

export const AppInput: React.FC<AppInputProps> = ({ 
  label, 
  labelHint, 
  sx, 
  textFieldSx,
  ...props 
}) => {
  return (
    <Box sx={{ mb: 2, width: '100%', ...sx }}>
      {label && (
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
          <Typography variant="subtitle2" component="label" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {label}
          </Typography>
          {labelHint && (
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', fontStyle: 'italic' }}>
              ({labelHint})
            </Typography>
          )}
        </Box>
      )}
      <TextField
        fullWidth
        hiddenLabel
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: alpha('#f1f5f9', 0.5),
            },
            '&.Mui-focused': {
              backgroundColor: 'background.paper',
              boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
          },
          ...textFieldSx
        }}
        {...props}
      />
    </Box>
  );
};
