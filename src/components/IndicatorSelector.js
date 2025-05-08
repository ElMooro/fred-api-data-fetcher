import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';

/**
 * Indicator Selector component for choosing economic indicators
 */
const IndicatorSelector = ({ selectedIndicator, onChange }) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  const indicators = [
    { value: 'gdp', label: 'Gross Domestic Product (GDP)' },
    { value: 'inflation', label: 'Inflation Rate (CPI)' },
    { value: 'unemployment', label: 'Unemployment Rate' },
    { value: 'interest_rates', label: 'Interest Rates' },
    { value: 'retail_sales', label: 'Retail Sales' }
  ];

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Economic Indicator
      </Typography>
      <FormControl fullWidth size="small">
        <InputLabel id="indicator-select-label">Indicator</InputLabel>
        <Select
          labelId="indicator-select-label"
          id="indicator-select"
          value={selectedIndicator}
          label="Indicator"
          onChange={handleChange}
        >
          {indicators.map((indicator) => (
            <MenuItem key={indicator.value} value={indicator.value}>
              {indicator.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default IndicatorSelector;
