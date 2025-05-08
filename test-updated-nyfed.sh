#!/bin/bash
echo "Testing updated NY Fed API endpoints..."

# Try the newer data format
echo -e "\n1. Testing new endpoint format..."
curl -s -o new_response.json -w "Status code: %{http_code}\n" \
  "https://markets.newyorkfed.org/read?productCode=50&eventCode=sovrate&limit=1"

# Try alternative domain
echo -e "\n2. Testing newyorkfed.org main domain..."
curl -s -I -w "Status code: %{http_code}\n" https://www.newyorkfed.org/

# Check FRED API for NY Fed data as alternative
echo -e "\n3. Testing FRED API for NY Fed data (SOFR)..."
curl -s -o fred_sofr.json -w "Status code: %{http_code}\n" \
  "https://api.stlouisfed.org/fred/series/observations?series_id=SOFR&api_key=YOUR_API_KEY&file_type=json&limit=1"
echo "Note: Replace YOUR_API_KEY with your actual FRED API key to make this request work"
