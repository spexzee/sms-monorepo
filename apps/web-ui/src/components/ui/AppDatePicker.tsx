import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, type DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { Box, Typography } from '@mui/material';

interface AppDatePickerProps extends Omit<DatePickerProps, 'renderInput' | 'slots' | 'slotProps'> {
  label: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  fullWidth?: boolean;
}

export const AppDatePicker: React.FC<AppDatePickerProps> = ({
  label,
  helperText,
  error,
  required,
  fullWidth = true,
  ...props
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
        <Typography 
          variant="caption" 
          fontWeight={600} 
          color={error ? 'error.main' : 'text.secondary'}
          sx={{ mb: 0.5, display: 'block', ml: 0.5 }}
        >
          {label} {required && '*'}
        </Typography>
        <DatePicker
          {...props}
          slotProps={{
            textField: {
              fullWidth: true,
              error,
              helperText,
              size: 'small',
              sx: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                    boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.1)',
                  },
                },
              },
            },
            actionBar: {
              actions: ['clear', 'today'],
            },
            popper: {
              sx: {
                '& .MuiPaper-root': {
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  border: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  fontWeight: 600,
                  color: 'primary.main',
                },
                '& .MuiDayCalendar-slideTransition': {
                  minHeight: 200,
                },
                '& .MuiPickersDay-root': {
                  borderRadius: 1.5,
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
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
