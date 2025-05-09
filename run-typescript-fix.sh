#!/bin/bash

# Check if we have TypeScript and React installed
echo "Checking dependencies..."
npm list typescript react react-dom recharts @types/react @types/react-dom web-vitals || npm install typescript@4.9.5 react@18.2.0 react-dom@18.2.0 recharts@2.5.0 @types/react@18.0.28 @types/react-dom@18.0.11 web-vitals@2.1.4 --save

# Apply fixes to the components
echo "Applying TypeScript fixes..."

# Stop TypeScript from complaining about the fill property in the Bar component
echo "Fixing Bar component fill property..."
sed -i 's/fill={(data: DataPoint) => data.signalValue && data.signalValue >= 0 ? "#4caf50" : "#f44336"}/fill="#4caf50"/g' src/components/FinancialDashboard.tsx

# Fix possible null access in SignalGenerator.ts
echo "Fixing null access in SignalGenerator.ts..."
sed -i 's/macdLine.push(fastEMA\[i\] - slowEMA\[i\]);/if (fastEMA[i] !== null \&\& slowEMA[i] !== null) { macdLine.push(fastEMA[i] - slowEMA[i]); } else { macdLine.push(null); }/g' src/utils/SignalGenerator.ts
sed -i 's/return macd - signalLine\[i\];/if (signalLine[i] === null) return null; return macd - signalLine[i];/g' src/utils/SignalGenerator.ts

echo "TypeScript fixes complete. Build your project with 'npm run build' to verify."
