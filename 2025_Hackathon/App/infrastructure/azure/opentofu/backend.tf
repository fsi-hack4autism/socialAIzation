# Remote state configuration for OpenTofu/Terraform
# Remote state allows teams to collaborate and prevents state file conflicts

# NOTE: This is a template file. Actual values should be provided during initialization.
# OpenTofu/Terraform doesn't support variables in backend configuration,
# so we use partial configuration and provide the rest during initialization.

terraform {
  # Azure Storage backend configuration
  backend "azurerm" {
    # Do not specify resource_group_name, storage_account_name, container_name here
    # These will be provided during terraform init
    key = "terraform.tfstate"  # State file name can be customized per environment
  }
}
