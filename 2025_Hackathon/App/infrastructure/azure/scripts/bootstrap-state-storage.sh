#!/bin/bash
# Bootstrap script to create Azure Storage for OpenTofu/Terraform state

# Check if environment name was provided
if [ -z "$1" ]; then
  echo "Usage: $0 <environment_name>"
  echo "Example: $0 dev"
  exit 1
fi

ENV=$1
LOCATION="eastus"
RESOURCE_GROUP="${ENV}-metaverse-social-rg"
STORAGE_ACCOUNT="${ENV}metaversestorage"
CONTAINER_NAME="tfstate"

echo "Creating Azure resources for ${ENV} environment..."

# Log in to Azure (uncomment if not already logged in)
# az login

# Create resource group
echo "Creating resource group: ${RESOURCE_GROUP}..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Create storage account
echo "Creating storage account: ${STORAGE_ACCOUNT}..."
az storage account create --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" --sku "Standard_LRS" --encryption-services blob

# Get storage account key
echo "Retrieving storage account key..."
ACCOUNT_KEY=$(az storage account keys list --resource-group "$RESOURCE_GROUP" --account-name "$STORAGE_ACCOUNT" --query '[0].value' -o tsv)

# Create blob container
echo "Creating blob container: ${CONTAINER_NAME}..."
az storage container create --name "$CONTAINER_NAME" --account-name "$STORAGE_ACCOUNT" --account-key "$ACCOUNT_KEY"

# Create backend config file
CONFIG_DIR="../../opentofu/example-backend-configs"
mkdir -p "$CONFIG_DIR"
CONFIG_FILE="${CONFIG_DIR}/backend-${ENV}.conf"

echo "Creating backend configuration file: ${CONFIG_FILE}..."
cat > "$CONFIG_FILE" << EOF
resource_group_name  = "${RESOURCE_GROUP}"
storage_account_name = "${STORAGE_ACCOUNT}"
container_name       = "${CONTAINER_NAME}"
key                  = "${ENV}.terraform.tfstate"
EOF

echo "Export the following environment variable to authenticate with Azure Storage:"
echo "export ARM_ACCESS_KEY=${ACCOUNT_KEY}"

echo "Bootstrap complete! You can now initialize OpenTofu/Terraform with:"
echo "cd ../opentofu && terraform init -backend-config=example-backend-configs/backend-${ENV}.conf"
