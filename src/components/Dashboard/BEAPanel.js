import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

/**
 * BEA Panel component to display Bureau of Economic Analysis data
 */
const BEAPanel = ({ data = [] }) => {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          BEA Economic Data
        </Typography>
        
        {!hasData && (
          <Typography variant="body2" color="textSecondary">
            No BEA data available for the selected parameters.
          </Typography>
        )}
        
        {hasData && (
          <Box>
            <Typography variant="subtitle2">
              Latest Value: {data[0]?.value?.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Date: {data[0]?.date}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Data points: {data.length}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BEAPanel;
