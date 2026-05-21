# This file defines input variables for the OpenTofu/Terraform configuration
# Variables make the configuration more flexible and reusable

# Required: The Azure resource group where all resources will be deployed
variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
  # No default - this must be provided at runtime or in a .tfvars file
}

# Optional: The Azure region for deployment, defaults to East US
variable "location" {
  description = "The Azure region to deploy resources"
  type        = string
  default     = "East US"  # Change this if you prefer a different region
}

# Optional: The app name (defaults to socialiazation)
variable "app_name" {
  description = "App name"
  type        = string
  default     = "socialaization"
}

# Optional: Environment name for resource naming and configuration
variable "environment_name" {
  description = "The environment name (dev, test, prod)"
  type        = string
  default     = "prod"  # Change to "dev" or "test" for non-production environments
}

# Optional
variable "storage_account_name" {
  description = "The name of the storage account"
  type        = string
  # No default - this must be provided at runtime or in a .tfvars file
}

## Container Images - NO DEFAULTS
variable "scenario_ui_container_image" {
  description = "The name of the scenario UI account"
  type        = string
}
variable "scenario_api_container_image" {
  description = "The name of the scenario API account"
  type        = string
}
variable "conversation_api_container_image" {
  description = "The name of the conversation API account"
  type        = string
}
variable "scenario_api_url" {
  description = "The URL of the Scenario API account"
  type        = string
}
variable "mongodb_connection_string" {
  description = "Mongodb connection string"
  type        = string
}
variable "mongodb_database_name" {
  description = "Mongodb database name"
  type        = string
}
variable "mongodb_user_collection" {
  description = "Mongodb collection name"
  type        = string
}
variable "mongodb_scenario_collection" {
  description = "Mongodb collection name"
  type        = string
}
variable "mongodb_session_collection" {
  description = "Mongodb collection name"
  type        = string
}
variable "mongodb_interaction_collection" {
  description = "Mongodb collection name"
  type        = string
}

# OpenAI variables
variable "azure_openai_api_key" {
  description = "Azure OpenAI API Key"
  type        = string
}
variable "azure_openai_deployment_name" {
  description = "Azure OpenAI deployment name"
  type        = string
}
variable "azure_openai_api_version" {
  description = "Azure OpenAI API version"
  type        = string
}
variable "azure_openai_endpoint" {
  description = "Azure OpenAI endpoint"
  type        = string
}