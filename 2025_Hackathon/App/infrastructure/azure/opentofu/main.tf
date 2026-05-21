# OpenTofu/Terraform configuration for Azure resources deployment
# This file defines all the infrastructure needed to run the Metaverse Social application

# Define the required providers - azurerm is the Azure Resource Manager provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"  # Use Azure provider version 3.x
    }
  }
}

# Configure the Azure provider
provider "azurerm" {
  features {}  # Required empty features block for azurerm provider
}

# Define common variables used throughout the configuration
locals {
  location        = "Central US"  # Azure region to deploy resources
  environment_name = "prod"    # Environment name (prod, dev, test)
  app_name        = "metaverse-social"  # Base name for all resources
}

# App Service Plan - Defines the compute resources for the backend API
# Think of this as the "hosting plan" that determines performance and cost
resource "azurerm_service_plan" "backend" {
  name                = "${local.app_name}-backend-${local.environment_name}-plan"
  location            = local.location
  resource_group_name = var.resource_group_name  # Comes from variables.tf
  os_type             = "Linux"  # Using Linux-based hosting
  sku_name            = "B1"     # Basic tier, suitable for development/light production
}

# MongoDB-compatible database using Azure Cosmos DB
resource "azurerm_cosmosdb_account" "mongodb" {
  name                = "${local.app_name}-db-${local.environment_name}"
  location            = local.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "MongoDB"

  capabilities {
    name = "EnableMongo"
  }

  capabilities {
    name = "EnableServerless"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = local.location
    failover_priority = 0
  }
  
  mongo_server_version = "4.2"
}

# Create a MongoDB database within the Cosmos account
resource "azurerm_cosmosdb_mongo_database" "main" {
  name                = "${local.app_name}-mongodb"
  resource_group_name = azurerm_cosmosdb_account.mongodb.resource_group_name
  account_name        = azurerm_cosmosdb_account.mongodb.name
}

# Backend App Service - This hosts the Scenario Management service (.NET Core API)
resource "azurerm_linux_web_app" "backend" {
  name                = "${local.app_name}-backend-${local.environment_name}"
  location            = local.location
  resource_group_name = var.resource_group_name
  service_plan_id     = azurerm_service_plan.backend.id
  https_only          = true

  site_config {
    application_stack {
      docker_image     = "node"
      docker_image_tag = "18-alpine"
    }
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_REGISTRY_SERVER_URL"          = "https://index.docker.io"
    "NODE_ENV"                            = local.environment_name
    "MONGODB_URI"                         = azurerm_cosmosdb_account.mongodb.connection_strings[0]
  }
}

# Frontend Static Web App - This hosts the React frontend application
# Static Web Apps provide global CDN, CI/CD, and custom domains
resource "azurerm_static_site" "frontend" {
  name                = "${local.app_name}-frontend-${local.environment_name}"
  resource_group_name = var.resource_group_name
  location            = local.location
  sku_tier            = "Standard"  # Standard tier provides more features than Free
  sku_size            = "Standard"

  # Environment variables for the Static Web App
  app_settings = {
    "REACT_APP_API_URL"       = "https://${azurerm_linux_web_app.backend.default_hostname}/api"  # Connect to backend
    "REACT_APP_ENVIRONMENT"   = local.environment_name  # Used for environment-specific config
  }
}

# Output values that will be displayed after deployment
output "mongodb_connection_string" {
  value     = azurerm_cosmosdb_account.mongodb.connection_strings[0]
  sensitive = true
}

output "backend_url" {
  value = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "frontend_url" {
  value = azurerm_static_site.frontend.default_host_name
}
