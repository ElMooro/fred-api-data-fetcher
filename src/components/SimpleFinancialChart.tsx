import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import moment from 'moment';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { DataPoint } from '../utils/SignalGenerator';
import CONFIG from '../config';

// Simplified tooltip component
const SimpleTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <Paper elevation={3} sx={{ p: 1, maxWidth: 250 }}>
        <Typography variant="body2">
          <strong>{moment(label).format("MMM D, YYYY")}</strong>
        </Typography>
        
        <Typography variant="body2" sx={{ mt: 1 }}>
          Value: <strong>{payload[0].value.toFixed(2)}</strong>
        </Typography>
        
        {data.signalValue !== undefined && (
          <Typography variant="body2">
            Signal: <strong>{data.signalValue.toFixed(2)}%</strong>
          </Typography>
        )}
        
        {data.crisis && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            <strong>{data.crisis.label}</strong>: {data.crisis.description}
          </Typography>
        )}
      </Paper>
    );
  }
  
  return null;
};

interface FinancialChartProps {
  data: DataPoint[];
  isLoading: boolean;
  error: string | null;
  indicatorName: string;
}

const SimpleFinancialChart: React.FC<FinancialChartProps> = ({ 
  data, 
  isLoading, 
  error, 
  indicatorName 
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }
  
  // Create a safe version of the data for Recharts
  const safeData = data.map(item => ({
    ...item,
    value: typeof item.value === 'number' ? item.value : 0,
    signalValue: typeof item.signalValue === 'number' ? item.signalValue : null
  }));
  
  return (
    <Box height="400px">
      
    </Box>
  );
};

export default SimpleFinancialChart;
