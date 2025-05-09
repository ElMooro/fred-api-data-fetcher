const fs = require('fs');
const path = require('path');

// Function to recursively get all files in a directory
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check if a file contains Recharts imports
function hasRechartsImports(content) {
  return /import.*from ['"]recharts['"]/.test(content) || 
         /import.*from ['"]recharts\/.*['"]/.test(content);
}

// Look for Recharts component tags
function hasRechartsComponents(content) {
  const rechartsComponents = [
    'BarChart', 'LineChart', 'AreaChart', 'ComposedChart', 'PieChart', 'RadarChart', 'ScatterChart',
    'Bar', 'Line', 'Area', 'Pie', 'Radar', 'Scatter', 'XAxis', 'YAxis', 'CartesianGrid',
    'Tooltip', 'Legend', 'ResponsiveContainer'
  ];
  
  for (const component of rechartsComponents) {
    if (new RegExp(`<${component}[^>]*>|<${component}[^>]*\/>`, 'g').test(content)) {
      return true;
    }
  }
  
  return false;
}

// Process files
const files = getAllFiles('src');
let affectedFiles = [];
let importLines = new Set();

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if this file uses Recharts
  if (hasRechartsImports(content) || hasRechartsComponents(content)) {
    affectedFiles.push(filePath);
    
    // Extract and store import lines for reference
    const importMatches = content.match(/import.*from ['"]recharts.*['"]/g);
    if (importMatches) {
      importMatches.forEach(line => importLines.add(line));
    }
  }
});

console.log(`Found ${affectedFiles.length} files using Recharts:`);
affectedFiles.forEach(file => console.log(`- ${file}`));

console.log("\nRecharts import patterns found:");
importLines.forEach(line => console.log(line));

// Create canvas-based chart component
const createCanvasChart = () => {
  return `import React, { useRef, useEffect } from 'react';
import moment from 'moment';

interface DataPoint {
  date?: string;
  name?: string;
  [key: string]: any;
}

interface CanvasChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  dataKey: string;
  xAxisDataKey?: string;
  title?: string;
  color?: string;
}

const CanvasChart: React.FC<CanvasChartProps> = ({
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
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < data.length; i++) {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      const value = typeof data[i][dataKey] === 'number' ? data[i][dataKey] : 0;
      const valuePercentage = (value - minValue) / valueRange;
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
      const value = typeof data[i][dataKey] === 'number' ? data[i][dataKey] : 0;
      const valuePercentage = (value - minValue) / valueRange;
      const y = canvas.height - padding - (valuePercentage * chartHeight);
      
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
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
      const label = data[i][xAxisDataKey] || '';
      const displayLabel = xAxisDataKey === 'date' && label ? moment(label).format('MMM YY') : String(label).substring(0, 10);
      ctx.fillText(displayLabel, x - 15, canvas.height - 10);
    }
    
    // Add title
    if (title) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(title, canvas.width / 2 - 50, 20);
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

export default CanvasChart;`;
};

// Create canvas-based bar chart component
const createCanvasBarChart = () => {
  return `import React, { useRef, useEffect } from 'react';
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

export default CanvasBarChart;`;
};

// Create components directory if it doesn't exist
if (!fs.existsSync('src/components')) {
  fs.mkdirSync('src/components', { recursive: true });
}

// Write the canvas chart components
fs.writeFileSync('src/components/CanvasChart.tsx', createCanvasChart());
fs.writeFileSync('src/components/CanvasBarChart.tsx', createCanvasBarChart());

console.log("\nCreated canvas-based chart components:");
console.log("- src/components/CanvasChart.tsx");
console.log("- src/components/CanvasBarChart.tsx");

// Process affected files and replace Recharts
let processedFiles = 0;

affectedFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 1. Replace Recharts imports
  if (hasRechartsImports(content)) {
    // Add canvas chart imports
    const canvasImport = `import CanvasChart from './components/CanvasChart';
import CanvasBarChart from './components/CanvasBarChart';`;
    
    // Remove all Recharts imports
    content = content.replace(/import.*from ['"]recharts.*['"];?\n?/g, '');
    
    // Add canvas chart imports if not already present
    if (!content.includes('import CanvasChart from')) {
      // Find a good place to insert the import
      const importLines = content.match(/import.*from.*['"]\r?\n/g) || [];
      if (importLines.length > 0) {
        const lastImport = importLines[importLines.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        content = content.slice(0, lastImportIndex) + canvasImport + '\n' + content.slice(lastImportIndex);
      } else {
        content = canvasImport + '\n' + content;
      }
    }
    
    modified = true;
  }
  
  // 2. Replace Recharts components with Canvas-based charts
  const rechartsChartTags = content.match(/<(BarChart|LineChart|AreaChart|ComposedChart)[^>]*>[\s\S]*?<\/(BarChart|LineChart|AreaChart|ComposedChart)>/g);
  
  if (rechartsChartTags) {
    rechartsChartTags.forEach(chartTag => {
      // Extract info to rebuild with canvas
      const isBarChart = chartTag.includes('<BarChart');
      const dataMatch = chartTag.match(/data=\{([^}]*)\}/);
      const widthMatch = chartTag.match(/width=\{([^}]*)\}/);
      const heightMatch = chartTag.match(/height=\{([^}]*)\}/);
      
      // Find data keys
      const barOrLineMatch = chartTag.match(/<(Bar|Line)[^>]*dataKey=["']([^"']*)["']/);
      const xAxisMatch = chartTag.match(/<XAxis[^>]*dataKey=["']([^"']*)["']/);
      
      // Only proceed if we have the minimal required info
      if (dataMatch && barOrLineMatch) {
        const dataVar = dataMatch[1];
        const dataKey = barOrLineMatch[2];
        const xAxisDataKey = xAxisMatch ? xAxisMatch[1] : 'date';
        const width = widthMatch ? widthMatch[1] : '800';
        const height = heightMatch ? heightMatch[1] : '400';
        
        // Build replacement canvas component
        const canvasComponent = isBarChart
          ? `<CanvasBarChart
  data={${dataVar}}
  width={${width}}
  height={${height}}
  dataKey="${dataKey}"
  xAxisDataKey="${xAxisDataKey}"
/>`
          : `<CanvasChart
  data={${dataVar}}
  width={${width}}
  height={${height}}
  dataKey="${dataKey}"
  xAxisDataKey="${xAxisDataKey}"
/>`;
        
        // Replace the entire chart tag
        content = content.replace(chartTag, canvasComponent);
        modified = true;
      }
    });
  }
  
  // Simple replacements for isolated Recharts components
  const rechartsComponentTags = [
    /<ResponsiveContainer[^>]*>[\s\S]*?<\/ResponsiveContainer>/g,
    /<(BarChart|LineChart|AreaChart|ComposedChart|PieChart|RadarChart|ScatterChart)[^>]*\/>[\s\S]*?/g,
    /<(Bar|Line|Area|Pie|Radar|Scatter|XAxis|YAxis|CartesianGrid|Tooltip|Legend)[^>]*\/>[\s\S]*?/g
  ];
  
  rechartsComponentTags.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });
  
  // Save changes if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    processedFiles++;
    console.log(`Updated ${filePath}`);
  }
});

console.log(`\nSuccessfully processed ${processedFiles} files, replacing Recharts with Canvas-based charts.`);
console.log("To completely remove Recharts, run: npm uninstall recharts");
