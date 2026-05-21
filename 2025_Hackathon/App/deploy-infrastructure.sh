#!/bin/bash
#
# Metaverse Social Practice - Infrastructure Deployment Script
# This script deploys only the Azure infrastructure using OpenTofu
#

# Exit on any error
set -e

# Configuration
RESOURCE_GROUP="metaverse-social-rg"
LOCATION="Central US"

# Output formatting
function write_step {
    echo ""
    echo "==================================================="
    echo "$1"
    echo "==================================================="
}

# Check if OpenTofu is installed
write_step "Checking prerequisites..."
if command -v tofu >/dev/null 2>&1; then
    echo "✅ OpenTofu is installed"
else
    echo "❌ OpenTofu is not installed. Please install it first."
    exit 1
fi

# Check if Azure CLI is installed
if command -v az >/dev/null 2>&1; then
    echo "✅ Azure CLI is installed"
else
    echo "❌ Azure CLI is not installed. Please install it first."
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

# Set environment variables
write_step "Setting environment variables..."
export RESOURCE_GROUP=$RESOURCE_GROUP
echo "✅ Environment variables set"

# Create Resource Group if it doesn't exist
write_step "Creating Resource Group if it doesn't exist..."
if [ "$(az group exists --name $RESOURCE_GROUP)" = "false" ]; then
    echo "Creating Resource Group: $RESOURCE_GROUP in $LOCATION"
    az group create --name $RESOURCE_GROUP --location "$LOCATION"
    echo "✅ Resource Group created"
else
    echo "✅ Resource Group already exists"
fi

# Extract OpenTofu state storage configuration from backend.tf
write_step "Reading OpenTofu state configuration..."
BACKEND_TF_PATH="infrastructure/azure/opentofu/backend.tf"

# Extract values using grep and sed
if [ -f "$BACKEND_TF_PATH" ]; then
    STORAGE_RG=$(grep -A 10 'backend "azurerm"' "$BACKEND_TF_PATH" | grep 'resource_group_name' | sed -E 's/.*resource_group_name[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
    STORAGE_ACCOUNT=$(grep -A 10 'backend "azurerm"' "$BACKEND_TF_PATH" | grep 'storage_account_name' | sed -E 's/.*storage_account_name[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
    CONTAINER_NAME=$(grep -A 10 'backend "azurerm"' "$BACKEND_TF_PATH" | grep 'container_name' | sed -E 's/.*container_name[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
    STATE_KEY=$(grep -A 10 'backend "azurerm"' "$BACKEND_TF_PATH" | grep 'key' | sed -E 's/.*key[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
    
    echo "Storage Resource Group: $STORAGE_RG"
    echo "Storage Account: $STORAGE_ACCOUNT"
    echo "Container Name: $CONTAINER_NAME"
    echo "State Key: $STATE_KEY"
else
    echo "❌ Backend configuration file not found at $BACKEND_TF_PATH"
    exit 1
fi

# Create storage for OpenTofu state if it doesn't exist
write_step "Checking OpenTofu state storage..."

# Check if storage resource group exists
if [ "$(az group exists --name $STORAGE_RG)" = "false" ]; then
    echo "Creating Resource Group for OpenTofu state: $STORAGE_RG"
    az group create --name $STORAGE_RG --location "$LOCATION"
fi

# Check if storage account exists
if ! az storage account show --name $STORAGE_ACCOUNT --resource-group $STORAGE_RG >/dev/null 2>&1; then
    echo "Creating Storage Account for OpenTofu state: $STORAGE_ACCOUNT"
    az storage account create \
        --name $STORAGE_ACCOUNT \
        --resource-group $STORAGE_RG \
        --location "$LOCATION" \
        --sku Standard_LRS \
        --kind StorageV2
fi

# Check if container exists
STORAGE_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group $STORAGE_RG --query "[0].value" -o tsv)
if ! az storage container show --name $CONTAINER_NAME --account-name $STORAGE_ACCOUNT --account-key "$STORAGE_KEY" >/dev/null 2>&1; then
    echo "Creating Storage Container for OpenTofu state: $CONTAINER_NAME"
    az storage container create \
        --name $CONTAINER_NAME \
        --account-name $STORAGE_ACCOUNT \
        --account-key "$STORAGE_KEY"
fi

echo "✅ OpenTofu state storage configured"

# Deploy infrastructure with OpenTofu
write_step "Deploying infrastructure with OpenTofu..."
cd infrastructure/azure/opentofu

echo "Initializing OpenTofu..."
# Set Azure storage account access key for backend
export ARM_ACCESS_KEY="$STORAGE_KEY"

tofu init

echo "Creating deployment plan..."
tofu plan -var="resource_group_name=$RESOURCE_GROUP" -out=tfplan

echo "Applying infrastructure configuration..."
tofu apply -auto-approve tfplan

# Display outputs
write_step "Infrastructure Outputs"
echo "Backend URL: $(tofu output -raw backend_url)"
echo "Frontend URL: $(tofu output -raw frontend_url)"
echo "MongoDB Connection String: $(tofu output -raw mongodb_connection_string | cut -c1-15)... (truncated for security)"

cd ../../..
echo "✅ Infrastructure deployed successfully"

write_step "Next Steps"
echo "Your Azure infrastructure has been successfully deployed."
echo "To deploy your applications, run:"
echo "  ./deploy-backend-only.sh"
echo ""
echo "Or for a complete deployment:"
echo "  ./deploy-azure.sh"
