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
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

resource "azurerm_resource_group" "devsocialaization" {
  name     = var.resource_group_name
  location = "East US"
}


resource "azurerm_log_analytics_workspace" "log_analytics" {
  name                = "${var.app_name}-${var.environment_name}-la"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  depends_on          = [ azurerm_resource_group.devsocialaization ]
}

resource "azurerm_container_app_environment" "container_env" {
  name                       = "${var.app_name}-${var.environment_name}-acaenv"
  location                   = var.location
  resource_group_name        = var.resource_group_name  # Comes from variables.tf
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log_analytics.id
  depends_on                 = [ azurerm_resource_group.devsocialaization, azurerm_log_analytics_workspace.log_analytics ]
}


# MongoDB-compatible database using Azure Cosmos DB
# ip_range_filter should NOT be 0.0.0.0.  Time is limited
resource "azurerm_cosmosdb_account" "mongodb" {
  name                = "${var.app_name}-db-${var.environment_name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "MongoDB"
  ip_range_filter     = "0.0.0.0,47.185.225.112"

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
    location          = var.location
    failover_priority = 0
  }
  
  mongo_server_version = "4.2"

  depends_on           = [ azurerm_resource_group.devsocialaization ]
}

# Create a MongoDB database within the Cosmos account
resource "azurerm_cosmosdb_mongo_database" "main" {
  name                = "${var.app_name}-mongodb"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.mongodb.name
  depends_on          = [ azurerm_cosmosdb_account.mongodb ]
}

resource "azurerm_container_app" "scenario_ui" {
  name                         = "${var.app_name}-${var.environment_name}-scen-ui"
  container_app_environment_id = azurerm_container_app_environment.container_env.id # Referencing the environment ID
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  template {
    container {
      name   = "scenario-ui"
      image  = var.scenario_ui_container_image
      cpu    = 0.25
      memory = "0.5Gi"
      env {
        name  = "VITE_API_URL"
        value = var.scenario_api_url
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  depends_on           = [ azurerm_resource_group.devsocialaization, azurerm_container_app_environment.container_env ]
}

resource "azurerm_container_app" "scenario_api" {
  name                         = "${var.app_name}-${var.environment_name}-scen-api"
  container_app_environment_id = azurerm_container_app_environment.container_env.id # Referencing the environment ID
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  template {
    container {
      name   = "scenario-api"
      image  = var.scenario_api_container_image
      cpu    = 0.25
      memory = "0.5Gi"
      env {
        name  = "MONGODB_CONNECTION_STRING"
        value = var.mongodb_connection_string
      }
      env {
        name  = "MONGODB_DATABASE_NAME"
        value = var.mongodb_database_name
      }
      env {
        name  = "MONGODB_USER_COLLECTION"
        value = var.mongodb_user_collection
      }
      env {
        name  = "MONGODB_SCENARIO_COLLECTION"
        value = var.mongodb_scenario_collection
      }
      env {
        name  = "MONGODB_SESSION_COLLECTION"
        value = var.mongodb_session_collection
      }
      env {
        name  = "MONGODB_INTERACTION_COLLECTION"
        value = var.mongodb_interaction_collection
      }
      env {
        name  = "CORS_ORIGIN"
        value = "*"
      }
      env {
        name  = "PORT"
        value = "3000"
      }
      env {
        name  = "NODE_ENV"
        value = "dev"
      }
      env {
        name  = "JWT_SECRET"
        value = "ignore"
      }
      env {
        name  = "JWT_EXPIRY"
        value = "1d"
      }
      env {
        name  = "SECRETS_PROVIDER"
        value = "env"
      }
      env {
        name  = "KEY_VAULT_NAME"
        value = "ignore"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
  depends_on           = [ azurerm_resource_group.devsocialaization, azurerm_container_app_environment.container_env ]
}

resource "azurerm_container_app" "conversation_api" {
  name                         = "${var.app_name}-${var.environment_name}-conv-api"
  container_app_environment_id = azurerm_container_app_environment.container_env.id # Referencing the environment ID
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  template {
    container {
      name   = "conversation-api"
      image  = var.conversation_api_container_image
      cpu    = 0.25
      memory = "0.5Gi"
      env {
        name  = "AZURE_OPENAI_API_KEY"
        value = var.azure_openai_api_key
      }
      env {
        name  = "DEPLOYMENT_NAME"
        value = var.azure_openai_deployment_name
      }
      env {
        name  = "API_VERSION"
        value = var.azure_openai_api_version
      }
      env {
        name  = "AZURE_OPENAI_ENDPOINT"
        value = var.azure_openai_endpoint
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  depends_on           = [ azurerm_resource_group.devsocialaization, azurerm_container_app_environment.container_env ]
}

# Output values that will be displayed after deployment
output "mongodb_connection_string" {
  value     = azurerm_cosmosdb_account.mongodb.primary_sql_connection_string
  sensitive = true
}

output "backend_url" {
  value = "https://${azurerm_container_app.scenario_ui.latest_revision_fqdn}"
}
