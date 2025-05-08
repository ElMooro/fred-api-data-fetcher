#!/bin/bash

# Set up some colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Pushing current working state to GitHub...${NC}"

# Check if git is initialized
if [ ! -d .git ]; then
  echo -e "${YELLOW}Initializing git repository...${NC}"
  git init
fi

# Check if remote origin exists
if ! git remote | grep -q "origin"; then
  echo -e "${YELLOW}Remote 'origin' not found.${NC}"
  
  # Ask for GitHub repository URL
  echo -e "${YELLOW}Enter your GitHub repository URL (https or SSH format):${NC}"
  read REPO_URL
  
  # Add remote origin
  git remote add origin $REPO_URL
  echo -e "${GREEN}Added remote origin: $REPO_URL${NC}"
fi

# Add all files
echo -e "${YELLOW}Adding all files to git...${NC}"
git add .

# Commit with a meaningful message
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo -e "${YELLOW}Committing changes with timestamp: $TIMESTAMP${NC}"
git commit -m "Working state with FRED and NY Fed APIs integration - $TIMESTAMP"

# Create a 'working' tag to mark this state
echo -e "${YELLOW}Creating 'last-working-state' tag...${NC}"
git tag -a "last-working-state-$(date +"%Y%m%d")" -m "Last working state - $TIMESTAMP"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push -u origin HEAD
git push --tags

echo -e "${GREEN}Successfully pushed current working state to GitHub!${NC}"
echo -e "${GREEN}Tagged as 'last-working-state-$(date +"%Y%m%d")'${NC}"
echo -e "${YELLOW}You can revert to this state later with:${NC}"
echo -e "  git checkout last-working-state-$(date +"%Y%m%d")"

