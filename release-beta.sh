#!/bin/bash
if [ -z "$1" ]; then
  echo "Please provide a commit message"
  echo "Usage: ./release-beta.sh \"your commit message\""
  exit 1
fi
COMMIT_MSG=$1
git add .
git commit -m "$COMMIT_MSG"
pnpm build-lib
if [ $? -ne 0 ]; then
  echo "Build failed"
  exit 1
fi
npm version prerelease --preid=beta
npm publish --tag beta
echo "Release completed successfully!"
