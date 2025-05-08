import React from 'react';
import { TextField, Box, Typography } from '@mui/material';

/**
 * Date Range Selector component for filtering data by date range
 */
const DateRangeSelector = ({ startDate, endDate, onChange }) => {
  const handleStartDateChange = (event) => {
    const newStartDate = event.target.value;
    onChange(newStartDate, endDate);
  };

  const handleEndDateChange = (event) => {
    const newEndDate = event.target.value;
    onChange(startDate, newEndDate);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Date Range
      </Typography>
      <Box display="flex" gap={2}>
        <TextField
          id="start-date"
          label="Start Date"
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          fullWidth
          size="small"
        />
        <TextField
          id="end-date"
          label="End Date"
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          fullWidth
          size="small"
        />
      </Box>
    </Box>
  );
};

export default DateRangeSelector;
