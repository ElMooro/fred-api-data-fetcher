import React, { useRef, useEffect } from 'react';
import moment from 'moment';

interface DataPoint {
  date?: string;
  name?: string;
  [key: string]: any;
}

interface CanvasBarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  dataKey: string;
  xAxisDataKey?: string;
  title?: string;
  color?: string;
}

const CanvasBarChart: React.FC<CanvasBarChartProps> = ({
  data,
  width = 800,
  height = 400,
  dataKey,
  xAxisDataKey = 'date',
  title = '',
  color = '#1976d2'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate value range
    const values = data.map(d => typeof d[dataKey] === 'number' ? d[dataKey] : 0);
    const minValue = Math.min(0, ...values) * 0.9; // Ensure 0 is included
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
    for (let i = 0; i < data.length; i++) {
      const x = padding + (chartWidth / data.length) * (i + 0.5);
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
    }
    ctx.stroke();
    
    // Draw bars
    const barWidth = (chartWidth / data.length) * 0.8;
    
    for (let i = 0; i < data.length; i++) {
      const value = typeof data[i][dataKey] === 'number' ? data[i][dataKey] : 0;
      const x = padding + (chartWidth / data.length) * i + (chartWidth / data.length) * 0.1;
      
      // Calculate bar height and y position
      const valuePercentage = (value - minValue) / valueRange;
      const barHeight = valuePercentage * chartHeight;
      const y = canvas.height - padding - barHeight;
      
      // Draw bar
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();
      
      // Add value label on top of bar
      if (value !== 0) {
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value.toFixed(0), x + barWidth / 2, y - 5);
      }
    }
    
    // Add labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange / 5) * i;
      const y = canvas.height - padding - (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(0), padding - 5, y + 4);
    }
    
    // X-axis labels
    ctx.textAlign = 'center';
    for (let i = 0; i < data.length; i++) {
      const x = padding + (chartWidth / data.length) * (i + 0.5);
      const label = data[i][xAxisDataKey] || '';
      const displayLabel = xAxisDataKey === 'date' && label ? moment(label).format('MMM YY') : String(label).substring(0, 8);
      ctx.fillText(displayLabel, x, canvas.height - padding + 15);
    }
    
    // Add title
    if (title) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 20);
    }
    
  }, [data, dataKey, xAxisDataKey, title, color, width, height]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default CanvasBarChart;