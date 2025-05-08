#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Pushing BEA API integration to GitHub...${NC}"

# Add all files
git add .

# Create commit message with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Add BEA API integration for GDP data - $TIMESTAMP"

# Create a tag for this version
git tag -a "v1.1.0-bea-integration" -m "Version 1.1.0 with BEA API integration - $TIMESTAMP"

# Push to GitHub
git push origin HEAD
git push --tags

echo -e "\n${GREEN}Successfully pushed BEA API integration to GitHub!${NC}"
echo -e "${GREEN}Tagged as 'v1.1.0-bea-integration'${NC}"

echo -e "\n${YELLOW}Your economic data dashboard now features:${NC}"
echo -e "1. FRED API integration for general economic data"
echo -e "2. NY Fed API integration for SOFR and other rates"
echo -e "3. BEA API integration for GDP growth data"
echo -e "\n${YELLOW}To start the application, run:${NC} npm start"

