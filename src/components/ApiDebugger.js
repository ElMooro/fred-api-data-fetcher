import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import ApiService from '../services/ApiService';

const ApiDebugger = () => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState({});

  const checkApiStatus = async () => {
    setIsLoading(true);
    try {
      const result = await ApiService.checkStatus();
      setStatus(result);
    } catch (error) {
      setStatus({ status: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testFredApi = async () => {
    setIsLoading(true);
    try {
      const result = await ApiService.fred.fetchSeries('GDP', '2023-01-01', '2025-01-01');
      setTestResults(prev => ({ ...prev, fred: { success: true, data: result } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, fred: { success: false, error: error.message } }));
    } finally {
      setIsLoading(false);
    }
  };

  const testBeaApi = async () => {
    setIsLoading(true);
    try {
      const result = await ApiService.bea.fetchData('NIPA', {
        TableName: 'T10101',
        Frequency: 'Q',
        Year: '2023'
      });
      setTestResults(prev => ({ ...prev, bea: { success: true, data: result } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, bea: { success: false, error: error.message } }));
    } finally {
      setIsLoading(false);
    }
  };

  const testBlsApi = async () => {
    setIsLoading(true);
    try {
      const result = await ApiService.bls.fetchTimeSeries(['CUUR0000SA0'], '2023', '2025');
      setTestResults(prev => ({ ...prev, bls: { success: true, data: result } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, bls: { success: false, error: error.message } }));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    checkApiStatus();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>API Debugger</Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">API Status</Typography>
        {isLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        
        <Button 
          variant="contained" 
          onClick={checkApiStatus}
          disabled={isLoading}
          sx={{ mt: 1, mb: 2 }}
        >
          Check Status
        </Button>
        
        {status && (
          <Box sx={{ mt: 2 }}>
            <Typography>Status: {status.status}</Typography>
            {status.keys && (
              <Box>
                <Typography variant="subtitle2">API Keys:</Typography>
                <ul>
                  {Object.entries(status.keys).map(([key, value]) => (
                    <li key={key}>
                      {key}: <span style={{ color: value === 'configured' ? 'green' : 'red' }}>{value}</span>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        )}
      </Paper>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="outlined" onClick={testFredApi} disabled={isLoading}>Test FRED API</Button>
        <Button variant="outlined" onClick={testBeaApi} disabled={isLoading}>Test BEA API</Button>
        <Button variant="outlined" onClick={testBlsApi} disabled={isLoading}>Test BLS API</Button>
      </Box>
      
      {Object.entries(testResults).map(([api, result]) => (
        <Paper key={api} sx={{ p: 2, mb: 2, bgcolor: result.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}>
          <Typography variant="h6">{api.toUpperCase()} Test Result: {result.success ? 'Success' : 'Failed'}</Typography>
          {result.success ? (
            <Box>
              <Typography variant="subtitle2">Sample Data:</Typography>
              <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(result.data?.slice(0, 3) || {}, null, 2)}
              </pre>
            </Box>
          ) : (
            <Typography color="error">{result.error}</Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default ApiDebugger;
