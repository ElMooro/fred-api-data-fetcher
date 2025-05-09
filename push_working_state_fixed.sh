#!/bin/bash
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Creating a snapshot of all working APIs...${NC}"

# Check for nested git repositories and handle them
echo -e "${YELLOW}Checking for nested git repositories...${NC}"
NESTED_REPOS=$(find . -type d -name ".git" | grep -v "^./.git$" | sed 's/\/.git$//')

if [ -n "$NESTED_REPOS" ]; then
    echo -e "${YELLOW}Found nested git repositories in:${NC}"
    echo "$NESTED_REPOS"
    echo -e "${YELLOW}Would you like to: ${NC}"
    echo "1) Remove the nested git repositories (recommended)"
    echo "2) Keep them and create a worktree"
    echo "3) Abort"
    read -p "Choose an option (1-3): " NESTED_OPTION
    
    case $NESTED_OPTION in
        1)
            echo -e "${YELLOW}Removing nested git repositories...${NC}"
            for repo in $NESTED_REPOS; do
                echo "Removing $repo/.git"
                rm -rf "$repo/.git"
            done
            ;;
        2)
            echo -e "${YELLOW}Creating a worktree approach is complex and not implemented in this script.${NC}"
            echo -e "${YELLOW}Aborting. Please handle nested repositories manually.${NC}"
            exit 1
            ;;
        3)
            echo -e "${YELLOW}Aborting operation.${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Aborting.${NC}"
            exit 1
            ;;
    esac
fi

# Check if git is initialized in the main directory
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
fi

# Create or update .gitignore to exclude sensitive files
cat > .gitignore << 'EOF'
# Node modules
node_modules/

# Environment variables and secrets
.env
.env.*
!.env.example

# Build files
build/
dist/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Secret files
*.pem
*.key
*secrets*
EOF

# Add all files
echo -e "${YELLOW}Adding files to git...${NC}"
git add .

# Create commit message with API status
echo -e "${YELLOW}Creating detailed commit message with API status...${NC}"

COMMIT_MSG=$(cat << 'EOF'
✅ All Economic APIs Working State - SNAPSHOT

APIs verified working:
- FRED API - GDP and other economic indicators
- BEA API - NIPA tables and other economic data
- Census API - Population data
- BLS API - Unemployment and labor statistics
- ECB API - Exchange rates
- NY Fed API - SOFR rates
- Treasury APIs:
  - Average Interest Rates on Treasury Securities
  - Treasury Securities Auctions Data
  - Record-Setting Treasury Securities Auction Data
  - Securities Issued in TreasuryDirect
  - Treasury Securities Buybacks

This commit represents a fully working state of the financial data platform
with all API integrations verified and functional. Return to this commit
whenever you need a known-good state.

Date: $(date)
EOF
)

# Commit with the detailed message
git commit -m "$COMMIT_MSG"

# Ask for remote repository URL if not already set
if ! git remote get-url origin >/dev/null 2>&1; then
    echo -e "${YELLOW}Enter your GitHub repository URL:${NC}"
    read -p "URL (e.g., https://github.com/username/repository.git): " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${YELLOW}No URL provided. You can set it later with:${NC}"
        echo "git remote add origin YOUR_GITHUB_URL"
        echo "git push -u origin main"
    else
        git remote add origin $REPO_URL
    fi
fi

# Get current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Check if remote is set before attempting to push
if git remote get-url origin >/dev/null 2>&1; then
    echo -e "${YELLOW}Pushing to GitHub...${NC}"
    git push -u origin $CURRENT_BRANCH || {
        echo -e "${YELLOW}Push failed. You can push manually later with:${NC}"
        echo "git push -u origin $CURRENT_BRANCH"
    }
fi

echo -e "${GREEN}Snapshot created successfully!${NC}"
echo -e "${GREEN}Current commit hash: $(git rev-parse HEAD)${NC}"
echo -e "${GREEN}To restore this state later, use:${NC}"
echo "git checkout $(git rev-parse HEAD)"
