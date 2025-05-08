#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set the BEA API key
BEA_API_KEY="997E5691-4F0E-4774-8B4E-CAE836D4AC47"

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}         Testing BEA API Key Activation Status             ${NC}"
echo -e "${BLUE}===========================================================${NC}"

echo -e "\n${YELLOW}Testing BEA API key: $BEA_API_KEY${NC}"

# Save to .env for future use if not already there
if [ -f .env ]; then
    if ! grep -q "BEA_API_KEY" .env; then
        echo "REACT_APP_BEA_API_KEY=$BEA_API_KEY" >> .env
        echo -e "${GREEN}API key saved to .env file${NC}"
    fi
else
    echo "REACT_APP_BEA_API_KEY=$BEA_API_KEY" > .env
    echo -e "${GREEN}API key saved to .env file${NC}"
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    RESPONSE=$(curl -s "https://apps.bea.gov/api/data?&UserID=$BEA_API_KEY&method=GetAPIDatasetList&ResultFormat=JSON")
    
    # Simple grep check without jq
    if echo "$RESPONSE" | grep -q "This UserId is not active"; then
        echo -e "${RED}Your API key is still NOT active.${NC}"
        echo -e "${YELLOW}Response contains:${NC} 'This UserId is not active.'"
        echo -e "${YELLOW}Please make sure you've clicked the activation link in the email from BEA.${NC}"
    elif echo "$RESPONSE" | grep -q "APIDatasetList"; then
        echo -e "${GREEN}Success! Your BEA API key is now active.${NC}"
        echo -e "${YELLOW}Response contains API dataset list.${NC}"
    else
        echo -e "${YELLOW}Unexpected response. Here's a snippet:${NC}"
        echo "$RESPONSE" | head -20
    fi
else
    # Use jq for prettier output if available
    RESPONSE=$(curl -s "https://apps.bea.gov/api/data?&UserID=$BEA_API_KEY&method=GetAPIDatasetList&ResultFormat=JSON")
    
    if echo "$RESPONSE" | jq -e '.BEAAPI.Results.Error' > /dev/null; then
        echo -e "${RED}Your API key is still NOT active.${NC}"
        echo -e "${YELLOW}Error message:${NC}"
        echo "$RESPONSE" | jq -r '.BEAAPI.Results.Error."@APIErrorDescription"'
    elif echo "$RESPONSE" | jq -e '.BEAAPI.Results.APIDatasetList' > /dev/null; then
        echo -e "${GREEN}Success! Your BEA API key is now active.${NC}"
        echo -e "${YELLOW}Available datasets:${NC}"
        echo "$RESPONSE" | jq -r '.BEAAPI.Results.APIDatasetList.Dataset[] | "- \(.DatasetName): \(.DatasetDescription)"' | head -5
        echo "  [... and more]"
    else
        echo -e "${YELLOW}Unexpected response:${NC}"
        echo "$RESPONSE" | jq '.'
    fi
fi

# Now, try a simple GDP data request to make sure it's fully functional
echo -e "\n${YELLOW}Testing GDP data retrieval...${NC}"
GDP_RESPONSE=$(curl -s "https://apps.bea.gov/api/data?&UserID=$BEA_API_KEY&method=GetData&DataSetName=NIPA&TableName=T10101&Frequency=Q&Year=2023&Quarter=Q4&ResultFormat=JSON")

if echo "$GDP_RESPONSE" | grep -q "Error"; then
    echo -e "${RED}Error retrieving GDP data:${NC}"
    if command -v jq &> /dev/null; then
        echo "$GDP_RESPONSE" | jq '.BEAAPI.Results.Error'
    else
        echo "$GDP_RESPONSE" | grep -o '"Error":[^}]*}'
    fi
else
    echo -e "${GREEN}Successfully retrieved GDP data!${NC}"
    if command -v jq &> /dev/null; then
        echo -e "${YELLOW}GDP data sample:${NC}"
        echo "$GDP_RESPONSE" | jq '.BEAAPI.Results.Data[0:3]'
    else
        echo -e "${YELLOW}GDP data response received successfully.${NC}"
    fi
fi

echo -e "\n${BLUE}===========================================================${NC}"
echo -e "${BLUE}         BEA API Key Status Check Complete                ${NC}"
echo -e "${BLUE}===========================================================${NC}"

echo -e "\nIf your key is active, you can now proceed with integrating BEA data into your application."
echo -e "If your key is still not active, please note the following:"
echo -e "1. It may take some time for the key to become active after clicking the activation link."
echo -e "2. You may need to request a new activation email if you can't find the original."
echo -e "3. Contact BEA support at developers@bea.gov if you continue to have issues."

