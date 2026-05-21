#!/bin/bash
#
# Metaverse Social Practice - Backend-Only Deployment Script
# This script deploys only the backend application to Azure
#

# Exit on any error
set -e

# Output formatting
function write_step {
    echo ""
    echo "==================================================="
    echo "$1"
    echo "==================================================="
}

# Check for required environment variables
# write_step "Checking environment variables..."
# REQUIRED_VARS=("AZURE_SUBSCRIPTION_ID" "AZURE_TENANT_ID")
# MISSING_VARS=()

# for VAR in "${REQUIRED_VARS[@]}"; do
#     if [ -z "${!VAR}" ]; then
#         MISSING_VARS+=("$VAR")
#     else
#         echo "✅ $VAR is set"
#     fi
# done

# if [ ${#MISSING_VARS[@]} -ne 0 ]; then
#     echo "❌ The following required environment variables are not set:"
#     for VAR in "${MISSING_VARS[@]}"; do
#         echo "   - $VAR"
#     done
#     echo ""
#     echo "Please set these environment variables before running this script."
#     echo "Example:"
#     echo "export AZURE_SUBSCRIPTION_ID=your-subscription-id"
#     echo "export AZURE_TENANT_ID=your-tenant-id"
#     exit 1
# fi

# Check if Azure CLI is installed
write_step "Checking prerequisites..."
if command -v az >/dev/null 2>&1; then
    echo "✅ Azure CLI is installed"
else
    echo "❌ Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if OpenTofu is installed
if command -v tofu >/dev/null 2>&1; then
    echo "✅ OpenTofu is installed"
else
    echo "❌ OpenTofu is not installed. Please install it first."
    exit 1
fi

# Login to Azure if not already logged in
write_step "Checking Azure login status..."
if ! az account show >/dev/null 2>&1; then
    echo "Logging in to Azure..."
    az login
else
    echo "✅ Already logged in to Azure"
fi

# Extract configuration from OpenTofu
write_step "Extracting configuration from OpenTofu..."
TOFU_DIR="infrastructure/azure/opentofu"

# Check if we're in the root directory
if [ ! -d "$TOFU_DIR" ]; then
    echo "❌ OpenTofu directory not found at $TOFU_DIR"
    echo "Make sure you're running this script from the project root directory."
    exit 1
fi

# Extract resource group name from variables.tf
VARIABLES_TF="$TOFU_DIR/variables.tf"
if [ -f "$VARIABLES_TF" ]; then
    # Extract default resource group if it exists
    DEFAULT_RG=$(grep -A 5 'variable "resource_group_name"' "$VARIABLES_TF" | grep 'default' | sed -E 's/.*default[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
fi

# Extract app name and environment from main.tf
MAIN_TF="$TOFU_DIR/main.tf"
if [ -f "$MAIN_TF" ]; then
    APP_NAME=$(grep -A 10 'locals' "$MAIN_TF" | grep 'app_name' | sed -E 's/.*app_name[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
    ENV_NAME=$(grep -A 10 'locals' "$MAIN_TF" | grep 'environment_name' | sed -E 's/.*environment_name[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
    echo "App Name: $APP_NAME"
    echo "Environment: $ENV_NAME"
fi

# Get current state from OpenTofu
pushd $TOFU_DIR > /dev/null
if tofu state list > /dev/null 2>&1; then
    # Get resource group from state
    if [ -z "$DEFAULT_RG" ]; then
        # Try to get resource group from state if not found in variables
        RG_LINE=$(tofu state list | grep azurerm_resource_group)
        if [ ! -z "$RG_LINE" ]; then
            RESOURCE_GROUP=$(tofu state show $RG_LINE | grep name | head -1 | sed -E 's/.*name[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
        fi
    else
        RESOURCE_GROUP=$DEFAULT_RG
    fi
    
    # Try to get backend app name directly from state
    BACKEND_LINE=$(tofu state list | grep azurerm_linux_web_app)
    if [ ! -z "$BACKEND_LINE" ]; then
        BACKEND_APP_NAME=$(tofu state show $BACKEND_LINE | grep name | head -1 | sed -E 's/.*name[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
        echo "Found backend app name from state: $BACKEND_APP_NAME"
    elif [ ! -z "$APP_NAME" ] && [ ! -z "$ENV_NAME" ]; then
        # Construct backend app name from app name and environment as defined in main.tf
        BACKEND_APP_NAME="${APP_NAME}-backend-${ENV_NAME}"
        echo "Constructed backend app name: $BACKEND_APP_NAME"
    fi
else
    # If state can't be accessed, try to get outputs
    if tofu output > /dev/null 2>&1; then
        BACKEND_URL=$(tofu output -raw backend_url 2>/dev/null || echo "")
        if [ ! -z "$BACKEND_URL" ]; then
            # Extract hostname from URL
            BACKEND_HOSTNAME=$(echo $BACKEND_URL | sed -E 's|https://([^/]+).*|\1|')
            # Get app name from hostname
            BACKEND_APP_NAME=$(az webapp list --query "[?defaultHostName=='$BACKEND_HOSTNAME'].name" -o tsv)
            # Get resource group from app
            if [ ! -z "$BACKEND_APP_NAME" ]; then
                RESOURCE_GROUP=$(az webapp list --query "[?name=='$BACKEND_APP_NAME'].resourceGroup" -o tsv)
            fi
        fi
    fi
fi
popd > /dev/null

# Fallback to default values if extraction failed
if [ -z "$RESOURCE_GROUP" ]; then
    RESOURCE_GROUP="metaverse-social-rg"
    echo "⚠️ Could not extract resource group from OpenTofu, using default: $RESOURCE_GROUP"
fi

if [ -z "$BACKEND_APP_NAME" ]; then
    BACKEND_APP_NAME="metaverse-social-backend-prod"
    echo "⚠️ Could not extract backend app name from OpenTofu, using default: $BACKEND_APP_NAME"
fi

echo "Resource Group: $RESOURCE_GROUP"
echo "Backend App Name: $BACKEND_APP_NAME"

# Set environment variables
write_step "Setting environment variables..."
export RESOURCE_GROUP=$RESOURCE_GROUP
export TF_VAR_resource_group_name=$RESOURCE_GROUP
echo "✅ Environment variables set"
echo "✅ OpenTofu variable TF_VAR_resource_group_name set to: $RESOURCE_GROUP"

# Build and package backend
write_step "Building and packaging backend application..."
cd App/backend

echo "Cleaning previous builds..."
npm run clean 2>/dev/null || echo "No clean script found, continuing..."

echo "Installing dependencies..."
npm install

echo "Building and packaging application using Node.js-based packaging approach..."
npm run package

# Run npm prune after packaging to clean up dev dependencies
echo "Pruning development dependencies..."
npm prune --production

# Check if the package was created successfully
if [ -f "deploy/metaverse-social-backend.zip" ]; then
    echo "✅ Backend application built and packaged successfully"
else
    echo "❌ Failed to create deployment package"
    exit 1
fi

cd ../..
echo "✅ Backend application built and packaged"

# Deploy backend to Azure
write_step "Deploying backend to Azure App Service..."
echo "Deploying ZIP package to Azure App Service..."
az webapp deployment source config-zip -g $RESOURCE_GROUP -n $BACKEND_APP_NAME --src App/backend/deploy/metaverse-social-backend.zip

echo "✅ Backend deployed to Azure"

# Configure App Service settings with OpenTofu outputs
write_step "Configuring App Service with resource connections..."
cd $TOFU_DIR

# Extract connection strings and endpoints from OpenTofu outputs
echo "Extracting connection information from OpenTofu outputs..."
MONGODB_CONNECTION_STRING=$(tofu output -raw mongodb_connection_string 2>/dev/null || echo "")
FRONTEND_URL=$(tofu output -raw frontend_url 2>/dev/null || echo "")

# Set App Service settings
echo "Setting App Service configuration..."
az webapp config appsettings set -g $RESOURCE_GROUP -n $BACKEND_APP_NAME --settings \
  MONGODB_CONNECTION_STRING="$MONGODB_CONNECTION_STRING" \
  FRONTEND_URL="https://$FRONTEND_URL" \
  NODE_ENV="production" \
  PORT="8080" \
  WEBSITES_PORT="8080"

cd ../../..
echo "✅ App Service configured with resource connections"

# Restart the app to apply new settings
echo "Restarting App Service to apply new settings..."
az webapp restart -g $RESOURCE_GROUP -n $BACKEND_APP_NAME

# Verify deployment
write_step "Verifying deployment..."
DEPLOYED_URL=$(az webapp show -g $RESOURCE_GROUP -n $BACKEND_APP_NAME --query defaultHostName -o tsv)
echo "Backend URL: https://$DEPLOYED_URL"

# Try to check health endpoint if it exists
if curl -s -f "https://$DEPLOYED_URL/api/health" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "⚠️ Health check endpoint not available or not responding. This might be normal if the endpoint doesn't exist."
fi

write_step "Backend Deployment Complete!"
echo "Your backend application has been successfully deployed to Azure."
echo "Backend URL: https://$DEPLOYED_URL"
