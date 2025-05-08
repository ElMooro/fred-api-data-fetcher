import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

/**
 * FRED Panel component to display Federal Reserve Economic Data
 */
const FREDPanel = ({ data = [] }) => {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          FRED Economic Data
        </Typography>
        
        {!hasData && (
          <Typography variant="body2" color="textSecondary">
            No FRED data available for the selected parameters.
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

export default FREDPanel;
