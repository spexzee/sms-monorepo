import React from 'react';
import { TextField, type TextFieldProps, Typography, Box } from '@mui/material';

export type AppInputProps = TextFieldProps & {
  labelHint?: string;
};

export const AppInput: React.FC<AppInputProps> = ({ 
  label, 
  labelHint, 
  sx, 
  ...props 
}) => {
  return (
    <Box sx={{ mb: 2, width: '100%' }}>
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
            '& fieldset': {
              borderColor: 'divider',
            },
          },
          ...sx
        }}
        {...props}
      />
    </Box>
  );
};
