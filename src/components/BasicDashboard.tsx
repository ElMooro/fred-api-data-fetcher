import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, Grid, 
  CircularProgress, Tabs, Tab, Select, MenuItem,
  FormControl, InputLabel, TextField, Button,
  IconButton, Tooltip, Chip, SelectChangeEvent
} from '@mui/material';
import { styled } from '@mui/system';
import { 
  Settings, Refresh, Download, TrendingUp, 
  TrendingDown, TrendingFlat, ArrowUpward, ArrowDownward 
} from '@mui/icons-material';
import moment from 'moment';
import CONFIG from '../config';

// Styled components
const StyledGrid = styled(Grid)({});

// Sample mock data generation
const generateMockData = (indicator: string, startDate: string, endDate: string) => {
  const start = moment(startDate);
  const end = moment(endDate);
  const monthDiff = end.diff(start, 'months');
  
  const result = [];
  
  for (let i = 0; i <= monthDiff; i++) {
    const date = moment(start).add(i, 'months').format('YYYY-MM-DD');
    
    // Base value depends on indicator
    let baseValue = 1000;
    switch (indicator) {
      case 'GDP':
        baseValue = 24000 + (i * 100);
        break;
      case 'UNRATE':
        baseValue = 3.5 + Math.sin(i/3);
        break;
      case 'INFLATION': 
        baseValue = 2.5 + Math.sin(i/2);
        break;
      case 'INTEREST':
        baseValue = 4.5 + Math.sin(i/4);
        break;
    }
    
    // Add some randomness
    const randomFactor = (Math.random() - 0.5) * 0.05; // ±2.5%
    const value = baseValue * (1 + randomFactor);
    
    // Signal value oscillates between -75 and 75
    const signalValue = Math.sin(i/3) * 75;
    
    // Every 6 months there's a crisis
    const crisis = i % 6 === 0 && i > 0 ? {
      label: `Sample Crisis ${Math.floor(i/6)}`,
      description: 'Sample financial event for testing'
    } : null;
    
    result.push({
      date,
      value,
      signalValue,
      signalType: getSignalType(signalValue),
      crisis
    });
  }
  
  return result;
};

// Get signal type based on value
const getSignalType = (value: number) => {
  if (value >= 50) return 'strong buy';
  if (value > 0) return 'buy';
  if (value <= -50) return 'strong sell';
  if (value < 0) return 'sell';
  return 'neutral';
};

// Signal indicator component
const SignalIndicator = ({ value, size = 'medium' }: { value: number, size?: string }) => {
  let color = '#ff9800'; // neutral (orange)
  let Icon = TrendingFlat;
  
  if (value >= 50) {
    color = '#2e7d32'; // strong buy (dark green)
    Icon = ArrowUpward;
  } else if (value > 0) {
    color = '#4caf50'; // buy (green)
    Icon = TrendingUp;
  } else if (value <= -50) {
    color = '#c62828'; // strong sell (dark red)
    Icon = ArrowDownward;
  } else if (value < 0) {
    color = '#f44336'; // sell (red)
    Icon = TrendingDown;
  }
  
  return (
    <Box display="flex" alignItems="center">
      <Icon style={{ color, fontSize: size === 'small' ? 16 : 24 }} />
      <Typography 
        variant={size === 'small' ? 'caption' : 'body1'}
        style={{ color, marginLeft: 4, fontWeight: 'bold' }}
      >
        {value.toFixed(1)}%
      </Typography>
    </Box>
  );
};

// Custom chart component using Canvas
const SimpleChart = ({ data, indicatorName }: { data: any[], indicatorName: string }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate value range
    const values = data.map(d => d.value);
    const minValue = Math.min(...values) * 0.9;
    const maxValue = Math.max(...values) * 1.1;
    const valueRange = maxValue - minValue;
    
    // Draw axes
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    
    // Y axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    
    // X axis
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw gridlines
    ctx.beginPath();
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    
    // Horizontal gridlines (5 lines)
    for (let i = 1; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
    }
    
    // Vertical gridlines (depending on data points)
    const step = Math.max(1, Math.floor(data.length / 10));
    for (let i = 0; i < data.length; i += step) {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
    }
    ctx.stroke();
    
    // Draw line for values
    ctx.beginPath();
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < data.length; i++) {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      const valuePercentage = (data[i].value - minValue) / valueRange;
      const y = canvas.height - padding - (valuePercentage * chartHeight);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Draw dots for data points
    for (let i = 0; i < data.length; i += Math.max(1, Math.floor(data.length / 20))) {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      const valuePercentage = (data[i].value - minValue) / valueRange;
      const y = canvas.height - padding - (valuePercentage * chartHeight);
      
      ctx.beginPath();
      ctx.fillStyle = '#1976d2';
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw crisis lines
    data.forEach((item, i) => {
      if (item.crisis) {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        
        ctx.beginPath();
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.moveTo(x, padding);
        ctx.lineTo(x, canvas.height - padding);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Add label
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Arial';
        ctx.fillText(item.crisis.label, x + 5, padding + 15);
      }
    });
    
    // Add labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange / 5) * i;
      const y = canvas.height - padding - (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(0), 5, y + 4);
    }
    
    // X-axis labels
    for (let i = 0; i < data.length; i += step) {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      const date = moment(data[i].date).format('MMM YY');
      ctx.fillText(date, x - 15, canvas.height - 10);
    }
    
    // Add title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(indicatorName, canvas.width / 2 - 50, 20);
    
  }, [data, indicatorName]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={400} 
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

// Main dashboard component
const BasicDashboard = () => {
  // State
  const [selectedIndicator, setSelectedIndicator] = useState('GDP');
  const [dateRange, setDateRange] = useState({
    start: CONFIG.DEFAULT_SETTINGS.DATE_RANGE.START,
    end: CONFIG.DEFAULT_SETTINGS.DATE_RANGE.END
  });
  const [activeTab, setActiveTab] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate mock data
  const indicators = [
    { id: 'GDP', name: 'Gross Domestic Product' },
    { id: 'UNRATE', name: 'Unemployment Rate' },
    { id: 'INFLATION', name: 'Consumer Price Index' },
    { id: 'INTEREST', name: 'Interest Rates' }
  ];
  
  const tabs = [
    { id: 'overview', label: 'Overview', source: null },
    { id: 'fred', label: 'FRED Data', source: 'fred' },
    { id: 'bea', label: 'BEA Data', source: 'bea' },
    { id: 'treasury', label: 'Treasury Data', source: 'treasury' }
  ];
  
  // Create mock data for each source
  const mockData = {
    fred: generateMockData(selectedIndicator, dateRange.start, dateRange.end),
    bea: generateMockData(selectedIndicator, dateRange.start, dateRange.end),
    treasury: generateMockData(selectedIndicator, dateRange.start, dateRange.end)
  };
  
  // Get current data for active tab
  const getCurrentData = () => {
    const sourceTab = tabs[activeTab];
    if (!sourceTab.source) {
      // For overview tab, return the FRED data
      return mockData.fred;
    }
    return mockData[sourceTab.source as keyof typeof mockData] || [];
  };
  
  const activeData = getCurrentData();
  
  // Calculate signal summary
  const getSignalSummary = () => {
    if (!activeData || activeData.length === 0) {
      return { value: 0, type: 'neutral', date: null };
    }
    
    const latestWithSignal = [...activeData]
      .reverse()
      .find(item => item.signalValue !== undefined);
      
    if (!latestWithSignal) {
      return { value: 0, type: 'neutral', date: null };
    }
    
    return {
      value: latestWithSignal.signalValue,
      type: latestWithSignal.signalType,
      date: latestWithSignal.date
    };
  };
  
  const signalSummary = getSignalSummary();
  
  // Event handlers
  const handleIndicatorChange = (event: SelectChangeEvent<string>) => {
    setSelectedIndicator(event.target.value);
  };
  
  const handleDateChange = (type: string, value: string) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <Box>
      {/* App Bar */}
      <Box sx={{ bgcolor: '#f5f5f5', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">Economic Indicators Dashboard</Typography>
        
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton onClick={() => setShowSettings(!showSettings)}>
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <StyledGrid container spacing={3}>
          {/* Controls Section */}
          <StyledGrid xs={12}>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <StyledGrid container spacing={2} alignItems="center">
                <StyledGrid xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Indicator</InputLabel>
                    <Select
                      value={selectedIndicator}
                      onChange={handleIndicatorChange}
                      label="Indicator"
                    >
                      {indicators.map(indicator => (
                        <MenuItem key={indicator.id} value={indicator.id}>
                          {indicator.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </StyledGrid>
                <StyledGrid xs={12} sm={4}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateChange("start", e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </StyledGrid>
                <StyledGrid xs={12} sm={4}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateChange("end", e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </StyledGrid>
              </StyledGrid>
            </Paper>
          </StyledGrid>
          
          {/* Signal Summary */}
          <StyledGrid xs={12} md={4}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                height: "100%",
                bgcolor: signalSummary.value > 0 ? "rgba(76, 175, 80, 0.1)" : 
                         signalSummary.value < 0 ? "rgba(244, 67, 54, 0.1)" : 
                         "inherit"
              }}
            >
              <Typography variant="h6" gutterBottom>
                Signal Summary
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" my={2}>
                <SignalIndicator value={signalSummary.value} size="large" />
              </Box>
              <Typography variant="body1" textAlign="center" textTransform="uppercase" fontWeight="bold">
                {signalSummary.type}
              </Typography>
              <Typography variant="caption" display="block" textAlign="center" color="textSecondary">
                Based on 4 metrics as of {signalSummary.date ? moment(signalSummary.date).format("MMM D, YYYY") : "N/A"}
              </Typography>
              
              <Box mt={2}>
                <Typography variant="subtitle2">Factors:</Typography>
                <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
                  {CONFIG.SIGNAL_METRICS.TECHNICAL.map(metric => (
                    <li key={metric.id}>
                      <Typography variant="caption">
                        {metric.name}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            </Paper>
          </StyledGrid>
          
          {/* Current Value */}
          <StyledGrid xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                {indicators.find(i => i.id === selectedIndicator)?.name || selectedIndicator}
              </Typography>
              
              {isLoading ? (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              ) : activeData.length > 0 ? (
                <>
                  <Typography variant="h4" textAlign="center" my={2}>
                    {activeData[activeData.length - 1].value.toFixed(2)}
                  </Typography>
                  
                  <Box display="flex" justifyContent="center" alignItems="center">
                    {activeData.length > 1 && (
                      <>
                        {activeData[activeData.length - 1].value > activeData[activeData.length - 2].value ? (
                          <ArrowUpward color="success" />
                        ) : (
                          <ArrowDownward color="error" />
                        )}
                        
                        <Typography variant="body2" color={
                          activeData[activeData.length - 1].value > activeData[activeData.length - 2].value 
                            ? "success.main" 
                            : "error.main"
                        }>
                          {Math.abs(
                            ((activeData[activeData.length - 1].value - activeData[activeData.length - 2].value) / 
                            activeData[activeData.length - 2].value) * 100
                          ).toFixed(2)}% from previous
                        </Typography>
                      </>
                    )}
                  </Box>
                  
                  <Typography variant="caption" display="block" textAlign="center" color="textSecondary" mt={1}>
                    Last updated: {moment(activeData[activeData.length - 1].date).format("MMM D, YYYY")}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" textAlign="center" my={4} color="text.secondary">
                  No data available
                </Typography>
              )}
            </Paper>
          </StyledGrid>
          
          {/* Recent Crises */}
          <StyledGrid xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Recent Financial Events
              </Typography>
              
              {CONFIG.FINANCIAL_CRISES.slice(-3).map((crisis, i) => (
                <Box key={i} mb={1.5} p={1.5} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
                  <Typography variant="subtitle2">
                    {crisis.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {moment(crisis.date).format("MMMM D, YYYY")}
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    {crisis.description}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </StyledGrid>
          
          {/* Tabs for different data sources */}
          <StyledGrid xs={12}>
            <Paper elevation={1}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {tabs.map((tab) => (
                  <Tab 
                    key={tab.id} 
                    label={tab.label}
                  />
                ))}
              </Tabs>
            </Paper>
          </StyledGrid>
          
          {/* Chart */}
          <StyledGrid xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              {isLoading ? (
                <Box display="flex" justifyContent="center" my={4} minHeight="400px" alignItems="center">
                  <CircularProgress />
                </Box>
              ) : activeData.length > 0 ? (
                <SimpleChart 
                  data={activeData} 
                  indicatorName={indicators.find(i => i.id === selectedIndicator)?.name || selectedIndicator} 
                />
              ) : (
                <Box textAlign="center" my={4} minHeight="200px" display="flex" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">
                    No data available for the selected indicator and date range
                  </Typography>
                </Box>
              )}
            </Paper>
          </StyledGrid>
          
          {/* Data Table */}
          <StyledGrid xs={12}>
            <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Historical Data</Typography>
                <Button 
                  startIcon={<Download />}
                  variant="outlined"
                  size="small"
                >
                  Export CSV
                </Button>
              </Box>
              
              {isLoading ? (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : activeData.length > 0 ? (
                <Box sx={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Date</th>
                        <th style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #e0e0e0" }}>Value</th>
                        <th style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>Signal</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Event</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...activeData]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by most recent first
                        .slice(0, 10) // Show only the most recent 10 data points
                        .map((item, i) => (
                          <tr key={i}>
                            <td style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #f5f5f5" }}>
                              {moment(item.date).format("MMM D, YYYY")}
                            </td>
                            <td style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #f5f5f5" }}>
                              {item.value.toFixed(2)}
                            </td>
                            <td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #f5f5f5" }}>
                              {item.signalValue !== undefined && (
                                <SignalIndicator value={item.signalValue} size="small" />
                              )}
                            </td>
                            <td style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #f5f5f5" }}>
                              {item.crisis ? (
                                <Chip 
                                  label={item.crisis.label} 
                                  size="small" 
                                  variant="outlined"
                                  color="default"
                                  sx={{ fontSize: "0.75rem" }}
                                />
                              ) : null}
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ) : (
                <Typography variant="body2" textAlign="center" my={2} color="text.secondary">
                  No data available for the selected criteria
                </Typography>
              )}
            </Paper>
          </StyledGrid>
        </StyledGrid>
      </Container>
    </Box>
  );
};

export default BasicDashboard;
