import React from 'react';
import { 
  FormControl, 
  Select, 
  type SelectProps, 
  MenuItem, 
  FormHelperText,
  Typography,
  Box
} from '@mui/material';

interface AppSelectOption {
  value: string | number;
  label: string;
}

interface AppSelectProps extends Omit<SelectProps, 'label'> {
  label?: string;
  options: AppSelectOption[];
  helperText?: string;
  labelHint?: string;
}

export const AppSelect: React.FC<AppSelectProps> = ({ 
  label, 
  options, 
  helperText, 
  error, 
  fullWidth = true,
  labelHint,
  ...props 
}) => {
  return (
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
        </Box>
      )}
      <FormControl fullWidth={fullWidth} error={error} size="small">
        <Select
          displayEmpty
          {...props}
          sx={{
            borderRadius: 1,
            backgroundColor: '#ffffff',
            '&:hover': {
              backgroundColor: '#f1f5f9',
            },
            ...props.sx
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </Box>
  );
};
