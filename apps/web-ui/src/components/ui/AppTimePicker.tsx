import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker, type TimePickerProps } from '@mui/x-date-pickers/TimePicker';
import { Box, Typography, alpha, type Theme } from '@mui/material';

export interface AppTimePickerProps extends Omit<TimePickerProps<any>, 'renderInput' | 'slots' | 'slotProps'> {
  label: string;
  labelHint?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  value?: Date | null;
  onChange: (value: Date | null) => void;
}

export const AppTimePicker: React.FC<AppTimePickerProps> = ({
  label,
  labelHint,
  helperText,
  error,
  required,
  fullWidth = true,
  ...props
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ mb: 2, width: fullWidth ? '100%' : 'auto' }}>
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
            {required && (
              <Typography variant="caption" color="error" sx={{ ml: 0.5 }}>
                *
              </Typography>
            )}
          </Box>
        )}
        <TimePicker
          {...props}
          slotProps={{
            textField: {
              fullWidth: true,
              error,
              helperText,
              size: 'small',
              hiddenLabel: true,
              sx: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: 'background.paper',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: alpha('#f1f5f9', 0.5),
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                    boxShadow: (theme: Theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                },
              },
            },
            popper: {
              sx: {
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  border: '1px solid',
                  borderColor: 'divider',
                  mt: 0.5,
                },
                '& .MuiClock-clock': {
                  backgroundColor: 'background.paper',
                },
                '& .MuiClockPointer-root': {
                  backgroundColor: 'primary.main',
                },
                '& .MuiClockNumber-root': {
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                  },
                },
              },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};
