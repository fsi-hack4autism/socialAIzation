resource "azurerm_linux_web_app" "backend" {
  // ...existing code...
  
  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "NODE_ENV"                = "production"
    "APP_ENV"                 = var.environment
    "SECRETS_PROVIDER"        = var.secrets_provider
    "MONGODB_CONNECTION_STRING" = "mongodb://${azurerm_cosmosdb_account.db.name}:${azurerm_key_vault_secret.cosmos_key.value}@${azurerm_cosmosdb_account.db.name}.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&replicaSet=globaldb&maxIdleTimeMS=120000&appName=@${azurerm_cosmosdb_account.db.name}@"
    "MONGODB_DATABASE_NAME"   = azurerm_cosmosdb_mongo_database.db.name
    
    # HashiCorp Vault configuration (if using)
    "VAULT_ADDR"              = var.vault_addr
    
    # Azure Key Vault (backwards compatibility)
    "KEY_VAULT_NAME"          = azurerm_key_vault.app_vault.name
    
    # Other non-sensitive settings
    "MONGODB_USER_COLLECTION"     = "users"
    "MONGODB_SCENARIO_COLLECTION" = "scenarios"
    "MONGODB_SESSION_COLLECTION"  = "sessions"
    "MONGODB_INTERACTION_COLLECTION" = "interactions"
  }
  
  // ...existing code...
}