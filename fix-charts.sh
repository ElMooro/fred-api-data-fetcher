#!/bin/bash

echo "Installing dependencies..."
npm install --save recharts@2.5.0

echo "Applying fixes to Recharts error..."
node fix-recharts-error.js

echo "Restarting the application..."
echo "Done! You may need to restart your React app with 'npm start' for changes to take effect."
