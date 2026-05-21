# This file defines input variables for the OpenTofu/Terraform configuration
# Variables make the configuration more flexible and reusable

# Required: The Azure resource group where all resources will be deployed
variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
  # No default - this must be provided at runtime or in a .tfvars file
}

# Optional: The Azure region for deployment, defaults to Central US
variable "location" {
  description = "The Azure region to deploy resources"
  type        = string
  default     = "Central US"  # Change this if you prefer a different region
}

# Optional: Environment name for resource naming and configuration
variable "environment_name" {
  description = "The environment name (dev, test, prod)"
  type        = string
  default     = "prod"  # Change to "dev" or "test" for non-production environments
}
