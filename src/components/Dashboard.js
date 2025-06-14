import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Card, CardContent, Typography, CircularProgress, Box } from '@mui/material';
import FREDPanel from './Dashboard/FREDPanel';
import BEAPanel from './Dashboard/BEAPanel';
import DateRangeSelector from './DateRangeSelector';
import IndicatorSelector from './IndicatorSelector';
import CONFIG from '../config';
import { useDataService } from '../hooks/useDataService';

// Name the component Dashboard explicitly
const Dashboard = () => {
  const [selectedIndicator, setSelectedIndicator] = useState(CONFIG.DEFAULT_INDICATOR);
  const [startDate, setStartDate] = useState(CONFIG.DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState(CONFIG.DEFAULT_END_DATE);
  const [indicatorDetails, setIndicatorDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { getIndicatorDetails } = useDataService();
  
  // Debounced function to fetch indicator details
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchIndicatorDetails = useCallback(debounce(async () => {
    if (!selectedIndicator) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const details = await getIndicatorDetails(
        selectedIndicator,
        startDate,
        endDate
      );
      setIndicatorDetails(details);
    } catch (err) {
      console.error('Error fetching indicator details:', err);
      setError(err.message || 'Failed to fetch indicator details');
      // Don't clear existing data on error to maintain partial functionality
    } finally {
      setIsLoading(false);
    }
  }, CONFIG.UI.DEBOUNCE_DELAY), [selectedIndicator, getIndicatorDetails, startDate, endDate]);
  
  // Fetch initial data
  useEffect(() => {
    fetchIndicatorDetails();
  }, [fetchIndicatorDetails]);
  
  const handleIndicatorChange = (indicator) => {
    setSelectedIndicator(indicator);
  };
  
  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };
  
  return (
    <div className="dashboard">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Economic Indicators Dashboard
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <IndicatorSelector
                    selectedIndicator={selectedIndicator}
                    onChange={handleIndicatorChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DateRangeSelector
                    startDate={startDate}
                    endDate={endDate}
                    onChange={handleDateRangeChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {isLoading && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" m={4}>
              <CircularProgress />
            </Box>
          </Grid>
        )}
        
        {error && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography color="error">{error}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {indicatorDetails && (
          <>
            <Grid item xs={12} md={6}>
              <FREDPanel data={indicatorDetails.fred || []} />
            </Grid>
            <Grid item xs={12} md={6}>
              <BEAPanel data={indicatorDetails.bea || []} />
            </Grid>
          </>
        )}
      </Grid>
    </div>
  );
};

// Utility debounce function
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Make sure to export the Dashboard component
export default Dashboard;
