#!/bin/bash

# Reset to beta.22
git reset --hard 5e41803

# Delete local tag
git tag -d v1.4.3-beta.23

# Delete remote tag
git push origin :refs/tags/v1.4.3-beta.23

# Unpublish from npm
npm unpublish vue-code-layout@1.4.3-beta.23 