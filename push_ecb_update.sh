#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Pushing ECB API integration to GitHub...${NC}"

# Add all files
git add .

# Create commit message with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Add ECB API integration for European economic data - $TIMESTAMP"

# Create a tag for this version
git tag -a "v1.2.0-global-dashboard" -m "Version 1.2.0 with global economic indicators - $TIMESTAMP"

# Push to GitHub
git push origin HEAD
git push --tags

echo -e "\n${GREEN}Successfully pushed ECB API integration to GitHub!${NC}"
echo -e "${GREEN}Tagged as 'v1.2.0-global-dashboard'${NC}"

echo -e "\n${YELLOW}Your global economic data dashboard now features:${NC}"
echo -e "1. U.S. Economic Data:"
echo -e "   - FRED API integration for general economic indicators"
echo -e "   - NY Fed API integration for SOFR interest rates"
echo -e "   - BEA API integration for GDP growth data"
echo -e "2. European Economic Data:"
echo -e "   - ECB API integration for euro area interest rates and inflation"
echo -e "\n${YELLOW}To start the application, run:${NC} npm start"

