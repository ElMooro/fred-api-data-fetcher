import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Grid, Card, CardContent, Typography, CircularProgress, Box, 
  Button, Paper, AppBar, Toolbar, IconButton, Container,
  Select, MenuItem, FormControl, InputLabel, TextField,
  Tab, Tabs, Chip, Badge, Tooltip
} from "@mui/material";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, ReferenceLine, Brush, Area, ComposedChart, Bar 
} from "recharts";
import { 
  Refresh, Download, Settings, TrendingUp, TrendingDown, 
  InfoOutlined, Add, Remove, ArrowUpward, ArrowDownward,
  TrendingFlat
} from "@mui/icons-material";
import moment from "moment";
import { useDataService } from "../hooks/useDataService";
import CONFIG from "../config";

// Custom components
const SignalIndicator = ({ value, size = "medium" }) => {
  // Determine signal type
  let color = "#ff9800"; // default - neutral (orange)
  let Icon = TrendingFlat;
  
  if (value >= 50) {
    color = "#2e7d32"; // strong buy (dark green)
    Icon = ArrowUpward;
  } else if (value > 0) {
    color = "#4caf50"; // buy (green)
    Icon = TrendingUp;
  } else if (value <= -50) {
    color = "#c62828"; // strong sell (dark red)
    Icon = ArrowDownward;
  } else if (value < 0) {
    color = "#f44336"; // sell (red)
    Icon = TrendingDown;
  }
  
  return (
    <Box display="flex" alignItems="center">
      <Icon style={{ color, fontSize: size === "small" ? 16 : 24 }} />
      <Typography 
        variant={size === "small" ? "caption" : "body1"}
        style={{ color, marginLeft: 4, fontWeight: "bold" }}
      >
        {value.toFixed(1)}%
      </Typography>
    </Box>
  );
};

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label, crises }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <Paper elevation={3} sx={{ p: 2, maxWidth: 300 }}>
        <Typography variant="subtitle2">{moment(label).format("MMM D, YYYY")}</Typography>
        <Box my={1}>
          <Typography variant="body2">
            Value: <strong>{payload[0].value.toFixed(2)}</strong>
          </Typography>
          
          {data.signalValue !== undefined && (
            <Box display="flex" alignItems="center" mt={1}>
              <Typography variant="body2" mr={1}>Signal:</Typography>
              <SignalIndicator value={data.signalValue} size="small" />
            </Box>
          )}
        </Box>
        
        {data.crisis && (
          <Box mt={1.5} p={1} bgcolor="rgba(0,0,0,0.1)" borderRadius={1}>
            <Typography variant="caption" color="textSecondary">
              <strong>{data.crisis.label}</strong>: {data.crisis.description}
            </Typography>
          </Box>
        )}
        
        {data.detailedSignals && data.detailedSignals.length > 0 && (
          <Box mt={1.5}>
            <Typography variant="caption" color="textSecondary">
              <strong>Signals:</strong>
            </Typography>
            {data.detailedSignals.map((signal, i) => (
              <Typography key={i} variant="caption" display="block" color="textSecondary">
                {signal.metric}: {signal.signal.toUpperCase()} ({signal.value})
              </Typography>
            ))}
          </Box>
        )}
      </Paper>
    );
  }
  
  return null;
};

const FinancialDashboard = () => {
  // State management
  const [selectedIndicator, setSelectedIndicator] = useState("GDP");
  const [selectedAPIs, setSelectedAPIs] = useState(["FRED", "BEA", "TREASURY"]);
  const [selectedMetrics, setSelectedMetrics] = useState(["RSI", "MACD", "SMA", "BB"]);
  const [dateRange, setDateRange] = useState({
    start: CONFIG.DEFAULT_SETTINGS.DATE_RANGE.START,
    end: CONFIG.DEFAULT_SETTINGS.DATE_RANGE.END
  });
  const [indicatorData, setIndicatorData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const { getIndicatorDetails } = useDataService();
  
  // List of available indicators
  const indicators = [
    { id: "GDP", name: "Gross Domestic Product" },
    { id: "UNRATE", name: "Unemployment Rate" },
    { id: "INFLATION", name: "Consumer Price Index" },
    { id: "INTEREST", name: "Interest Rates" }
  ];
  
  // Tabs mapping
  const tabs = [
    { id: "overview", label: "Overview", source: null },
    { id: "fred", label: "FRED Data", source: "fred" },
    { id: "bea", label: "BEA Data", source: "bea" },
    { id: "treasury", label: "Treasury Data", source: "treasury" },
    { id: "bls", label: "BLS Data", source: "bls" },
    { id: "ecb", label: "ECB Data", source: "ecb" }
  ];
  
  // Fetch data when inputs change
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getIndicatorDetails(
        selectedIndicator, 
        dateRange.start, 
        dateRange.end,
        selectedAPIs,
        selectedMetrics
      );
      setIndicatorData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedIndicator, 
    dateRange.start, 
    dateRange.end, 
    selectedAPIs,
    selectedMetrics,
    getIndicatorDetails
  ]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Get active data source based on tab
  const activeData = useMemo(() => {
    const source = tabs[activeTab].source;
    if (!source) {
      // For overview tab, combine all available data sources
      const allData = Object.values(indicatorData).flat().filter(Boolean);
      return allData.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return indicatorData[source] || [];
  }, [activeTab, indicatorData, tabs]);
  
  // Calculate buy/sell signal summary
  const signalSummary = useMemo(() => {
    if (!activeData || activeData.length === 0) return { value: 0, type: "neutral" };
    
    // Get the most recent data point with a signal
    const latestWithSignal = [...activeData]
      .reverse()
      .find(item => item.signalValue !== undefined);
      
    if (!latestWithSignal) return { value: 0, type: "neutral" };
    
    let type = "neutral";
    if (latestWithSignal.signalValue >= 50) type = "strong buy";
    else if (latestWithSignal.signalValue > 0) type = "buy";
    else if (latestWithSignal.signalValue <= -50) type = "strong sell";
    else if (latestWithSignal.signalValue < 0) type = "sell";
    
    return { 
      value: latestWithSignal.signalValue, 
      type,
      date: latestWithSignal.date
    };
  }, [activeData]);
  
  // Handlers
  const handleIndicatorChange = (event) => {
    setSelectedIndicator(event.target.value);
  };
  
  const handleDateChange = (type, value) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleAPIToggle = (api) => {
    setSelectedAPIs(prev => {
      if (prev.includes(api)) {
        return prev.filter(item => item !== api);
      } else {
        return [...prev, api];
      }
    });
  };
  
  const handleMetricToggle = (metric) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metric)) {
        return prev.filter(item => item !== metric);
      } else {
        return [...prev, metric];
      }
    });
  };
  
  const handleExportData = () => {
    if (!activeData || activeData.length === 0) return;
    
    const csvContent = [
      // Header row
      ["Date", "Value", "Signal Value", "Signal Type", "Crisis"].join(","),
      // Data rows
      ...activeData.map(item => [
        item.date,
        item.value,
        item.signalValue || "",
        item.signalType || "",
        item.crisis ? item.crisis.label : ""
      ].join(","))
    ].join("\\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedIndicator}_${tabs[activeTab].id}_data.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Box>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Economic Indicators Dashboard
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchData} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExportData} disabled={isLoading || !activeData.length}>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton onClick={() => setShowSettings(!showSettings)}>
              <Settings />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Controls Section */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
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
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateChange("start", e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateChange("end", e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              
              {/* API and Metrics Selection - Visible when Settings is toggled */}
              {showSettings && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Data Sources
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {["FRED", "BEA", "BLS", "CENSUS", "ECB", "BIS", "TREASURY"].map(api => (
                      <Chip
                        key={api}
                        label={api}
                        color={selectedAPIs.includes(api) ? "primary" : "default"}
                        onClick={() => handleAPIToggle(api)}
                        clickable
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Signal Metrics
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {CONFIG.SIGNAL_METRICS.TECHNICAL.map(metric => (
                      <Chip
                        key={metric.id}
                        label={metric.name}
                        color={selectedMetrics.includes(metric.id) ? "secondary" : "default"}
                        onClick={() => handleMetricToggle(metric.id)}
                        clickable
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Signal Summary */}
          <Grid item xs={12} md={4}>
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
                Based on {selectedMetrics.length} metrics as of {signalSummary.date ? moment(signalSummary.date).format("MMM D, YYYY") : "N/A"}
              </Typography>
              
              <Box mt={2}>
                <Typography variant="subtitle2">Factors:</Typography>
                <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
                  {selectedMetrics.map(metric => {
                    const metricInfo = [...CONFIG.SIGNAL_METRICS.TECHNICAL, ...CONFIG.SIGNAL_METRICS.ECONOMIC]
                      .find(m => m.id === metric);
                    return metricInfo ? (
                      <li key={metric}>
                        <Typography variant="caption">
                          {metricInfo.name}
                        </Typography>
                      </li>
                    ) : null;
                  })}
                </ul>
              </Box>
            </Paper>
          </Grid>
          
          {/* Current Value */}
          <Grid item xs={12} md={4}>
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
          </Grid>
          
          {/* Recent Crises */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Recent Financial Events
              </Typography>
              
              {CONFIG.FINANCIAL_CRISES.slice(-3).map((crisis, index) => (
                <Box key={index} mb={1.5} p={1.5} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
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
          </Grid>
          
          {/* Tabs for different data sources */}
          <Grid item xs={12}>
            <Paper elevation={1}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {tabs.map((tab, index) => (
                  <Tab 
                    key={tab.id} 
                    label={tab.label} 
                    disabled={tab.source && (!indicatorData[tab.source] || indicatorData[tab.source].length === 0)}
                  />
                ))}
              </Tabs>
            </Paper>
          </Grid>
          
          {/* Chart */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              {isLoading ? (
                <Box display="flex" justifyContent="center" my={4} minHeight="400px" alignItems="center">
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box textAlign="center" my={4} minHeight="200px" display="flex" alignItems="center" justifyContent="center">
                  <Typography color="error">{error}</Typography>
                </Box>
              ) : activeData.length > 0 ? (
                <Box height="500px">
                  
                </Box>
              ) : (
                <Box textAlign="center" my={4} minHeight="200px" display="flex" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">
                    No data available for the selected indicator and date range
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Data Table */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Historical Data</Typography>
                <Button 
                  startIcon={<Download />}
                  disabled={isLoading || !activeData.length}
                  onClick={handleExportData}
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
                        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by most recent first
                        .slice(0, 10) // Show only the most recent 10 data points
                        .map((item, index) => (
                          <tr key={index}>
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
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default FinancialDashboard;
