#!/bin/bash

# ----------------------
# Azure App Service Deployment Script
# ----------------------

# 1. Install production dependencies
echo "Installing production dependencies..."
npm install --production

# 2. Make sure the build is up to date
echo "Building TypeScript code..."
npm run build

# 3. Start the application
echo "Starting application..."
cd dist
exec npm start
