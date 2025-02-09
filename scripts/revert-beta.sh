#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Show help message
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo -e "${BOLD}Revert Beta Version Script${NC}"
    echo -e "\nThis script helps you revert a beta version by:"
    echo "  1. Resetting to a specific commit"
    echo "  2. Removing the local and remote git tags"
    echo "  3. Unpublishing the npm package"
    echo -e "\n${BOLD}Usage:${NC}"
    echo -e "  $0 <commit-hash> <beta-number>"
    echo -e "\n${BOLD}Example:${NC}"
    echo -e "  $0 5e41803 23    ${GREEN}# Reverts to commit 5e41803 and removes beta.23${NC}"
    echo -e "\n${BOLD}Parameters:${NC}"
    echo "  commit-hash: The git commit hash to reset to"
    echo "  beta-number: The beta version number to remove (e.g., 23 for beta.23)"
    exit 0
fi

# Check if we have the right number of arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Error: Wrong number of arguments${NC}"
    echo -e "Run ${YELLOW}$0 --help${NC} for usage information"
    exit 1
fi

COMMIT_HASH=$1
BETA_NUM=$2
VERSION="1.4.3-beta.${BETA_NUM}"

echo -e "\n${BOLD}🔄 Starting reversion process${NC}"
echo -e "${YELLOW}This will:${NC}"
echo -e "  • Reset to commit ${BOLD}${COMMIT_HASH}${NC}"
echo -e "  • Remove version ${BOLD}${VERSION}${NC}"
echo -e "  • Unpublish from npm\n"

# Prompt for confirmation
read -p "Do you want to continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}Operation cancelled${NC}"
    exit 1
fi

echo -e "\n${GREEN}➤ Resetting to commit ${COMMIT_HASH}...${NC}"
git reset --hard $COMMIT_HASH

echo -e "\n${GREEN}➤ Removing local tag v${VERSION}...${NC}"
git tag -d "v${VERSION}" || echo -e "${YELLOW}Warning: Local tag not found${NC}"

echo -e "\n${GREEN}➤ Removing remote tag v${VERSION}...${NC}"
git push origin ":refs/tags/v${VERSION}" || echo -e "${YELLOW}Warning: Remote tag not found${NC}"

echo -e "\n${GREEN}➤ Unpublishing from npm...${NC}"
npm unpublish "vue-code-layout@${VERSION}" || echo -e "${RED}Error: Failed to unpublish from npm${NC}"

echo -e "\n${GREEN}✓ Done!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "  1. Verify that the package was unpublished: npm view vue-code-layout versions"
echo "  2. Check that you're on the right commit: git log -1"
echo "  3. Push your changes if needed: git push -f origin HEAD" 