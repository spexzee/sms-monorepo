import { Box, Typography } from '@mui/material';
import { AppCard } from './AppCard';

export const AppSection: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ 
  title, 
  children, 
  action 
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {title}
        </Typography>
        {action}
      </Box>
      <AppCard>
        {children}
      </AppCard>
    </Box>
  );
};
