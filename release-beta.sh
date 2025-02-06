#!/bin/bash
if [ -z "$1" ]; then
  echo "Please provide a commit message"
  echo "Usage: ./release-beta.sh \"your commit message\""
  exit 1
fi

COMMIT_MSG=$1

# Run type check and look for errors
if pnpm type-check 2>&1 | grep -q "error"; then
  echo "Errors found. Aborting release."
  pnpm type-check
  exit 1
fi

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
