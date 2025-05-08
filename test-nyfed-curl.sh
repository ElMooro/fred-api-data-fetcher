#!/bin/bash

echo "===== NY Fed API Test with curl ====="
echo "Testing date: $(date)"
echo ""

echo "1. Testing SOFR endpoint..."
curl -s -o sofr_response.json -w "Status code: %{http_code}\n" \
  https://markets.newyorkfed.org/api/rates/sofr/last/1.json

if [ $? -eq 0 ]; then
  echo "Response saved to sofr_response.json"
  echo "Response size: $(wc -c < sofr_response.json) bytes"
  echo "First 100 characters:"
  head -c 100 sofr_response.json
  echo -e "\n"
else
  echo "curl command failed with error $?"
fi

echo ""
echo "2. Testing direct HTTPS connection to markets.newyorkfed.org..."
curl -s -I -w "Status code: %{http_code}\n" \
  https://markets.newyorkfed.org/

echo -e "\nTest completed!"
