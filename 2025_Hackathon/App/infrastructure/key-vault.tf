# Azure Key Vault for secrets management
resource "azurerm_key_vault" "app_vault" {
  name                        = "mvsp-${var.environment}-kv"
  location                    = azurerm_resource_group.rg.location
  resource_group_name         = azurerm_resource_group.rg.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false

  sku_name = "standard"

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
    ip_rules       = var.allowed_ip_ranges
  }

  tags = {
    environment = var.environment
  }
}

# Give the backend web app access to the Key Vault
resource "azurerm_key_vault_access_policy" "backend_policy" {
  key_vault_id = azurerm_key_vault.app_vault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.backend.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}

# Current user deploying this configuration needs admin access
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault_access_policy" "deployer_policy" {
  key_vault_id = azurerm_key_vault.app_vault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = [
    "Get", 
    "List", 
    "Set", 
    "Delete", 
    "Purge"
  ]
}

# Store basic secrets in Key Vault
resource "azurerm_key_vault_secret" "cosmos_key" {
  name         = "COSMOSDB-KEY"
  value        = azurerm_cosmosdb_account.db.primary_key
  key_vault_id = azurerm_key_vault.app_vault.id
  depends_on   = [azurerm_key_vault_access_policy.deployer_policy]
}

resource "azurerm_key_vault_secret" "cosmos_endpoint" {
  name         = "COSMOSDB-ENDPOINT"
  value        = azurerm_cosmosdb_account.db.endpoint
  key_vault_id = azurerm_key_vault.app_vault.id
  depends_on   = [azurerm_key_vault_access_policy.deployer_policy]
}

# Generate a random JWT secret for the environment
resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "JWT-SECRET"
  value        = random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.app_vault.id
  depends_on   = [azurerm_key_vault_access_policy.deployer_policy]
}
