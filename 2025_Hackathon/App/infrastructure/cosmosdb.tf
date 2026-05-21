resource "azurerm_cosmosdb_account" "db" {
  name                = "mvsp-${var.environment}-cosmos"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type          = "Standard"
  kind                = "MongoDB"  # Use MongoDB API

  capabilities {
    name = "EnableMongo"
  }

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  geo_location {
    location          = azurerm_resource_group.rg.location
    failover_priority = 0
  }

  # Enable MongoDB version 4.0 API
  capabilities {
    name = "MongoDBv4.0"
  }
  
  # Enable serverless if needed
  # capabilities {
  #   name = "EnableServerless"
  # }

  tags = {
    environment = var.environment
  }
}

resource "azurerm_cosmosdb_mongo_database" "db" {
  name                = "metaverse-social-${var.environment}"
  resource_group_name = azurerm_cosmosdb_account.db.resource_group_name
  account_name        = azurerm_cosmosdb_account.db.name
}

# Create MongoDB collections
resource "azurerm_cosmosdb_mongo_collection" "users" {
  name                = "users"
  resource_group_name = azurerm_cosmosdb_account.db.resource_group_name
  account_name        = azurerm_cosmosdb_account.db.name
  database_name       = azurerm_cosmosdb_mongo_database.db.name

  default_ttl_seconds = -1
  shard_key           = "userId"
  throughput          = 400

  index {
    keys   = ["_id"]
    unique = true
  }
}

resource "azurerm_cosmosdb_mongo_collection" "scenarios" {
  name                = "scenarios"
  resource_group_name = azurerm_cosmosdb_account.db.resource_group_name
  account_name        = azurerm_cosmosdb_account.db.name
  database_name       = azurerm_cosmosdb_mongo_database.db.name

  default_ttl_seconds = -1
  shard_key           = "scenarioId"
  throughput          = 400

  index {
    keys   = ["_id"]
    unique = true
  }
}

resource "azurerm_cosmosdb_mongo_collection" "sessions" {
  name                = "sessions"
  resource_group_name = azurerm_cosmosdb_account.db.resource_group_name
  account_name        = azurerm_cosmosdb_account.db.name
  database_name       = azurerm_cosmosdb_mongo_database.db.name

  default_ttl_seconds = -1
  shard_key           = "sessionId"
  throughput          = 400

  index {
    keys   = ["_id"]
    unique = true
  }
}

resource "azurerm_cosmosdb_mongo_collection" "interactions" {
  name                = "interactions"
  resource_group_name = azurerm_cosmosdb_account.db.resource_group_name
  account_name        = azurerm_cosmosdb_account.db.name
  database_name       = azurerm_cosmosdb_mongo_database.db.name

  default_ttl_seconds = -1
  shard_key           = "interactionId"
  throughput          = 400

  index {
    keys   = ["_id"]
    unique = true
  }
}
