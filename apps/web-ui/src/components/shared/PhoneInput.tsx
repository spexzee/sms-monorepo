import React from 'react';
import { InputAdornment, Box, Typography } from '@mui/material';
import { AppInput, type AppInputProps } from './AppInput';

/**
 * A standardized Phone Input component for the SMS system.
 * Features:
 * - Enforced numeric-only input.
 * - 10-digit limit.
 * - Fixed Indian (+91) country code prefix.
 * - Premium look with visual adornment.
 */
export const PhoneInput: React.FC<AppInputProps> = ({ onChange, value, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 10
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);

    if (onChange) {
      // Create a modified event to pass back up
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: props.name || '',
          value: val,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <AppInput
      {...props}
      value={value}
      onChange={handleChange}
      type="text"
      placeholder="00000 00000"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pr: 1.5,
                mr: 0.5,
                borderRight: '1.5px solid',
                borderColor: 'divider',
                height: '1.5rem',
                userSelect: 'none'
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  lineHeight: '1'
                }}
              >
                +91
              </Typography>
            </Box>
          </InputAdornment>
        ),
        ...props.InputProps,
      }}
      inputProps={{
        maxLength: 10,
        inputMode: 'numeric',
        pattern: '[0-9]*',
        autoComplete: 'tel-national',
        ...props.inputProps,
      }}
    />
  );
};
