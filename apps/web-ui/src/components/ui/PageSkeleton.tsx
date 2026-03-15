import React from 'react';
import { Box, Skeleton, Grid, Container } from '@mui/material';

const PageSkeleton: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={250} height={60} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={400} height={30} />
      </Box>

      <Grid container spacing={3}>
        {/* Top Stats */}
        {[1, 2, 3, 4].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Skeleton
              variant="rectangular"
              height={140}
              sx={{ borderRadius: 4 }}
            />
          </Grid>
        ))}

        {/* Main Content Area */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton
            variant="rectangular"
            height={400}
            sx={{ borderRadius: 4 }}
          />
        </Grid>

        {/* Sidebar/Recent Area */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton
            variant="rectangular"
            height={400}
            sx={{ borderRadius: 4 }}
          />
        </Grid>

        {/* Full Width Table Area */}
        <Grid size={{ xs: 12 }}>
          <Skeleton
            variant="rectangular"
            height={300}
            sx={{ borderRadius: 4 }}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default PageSkeleton;
