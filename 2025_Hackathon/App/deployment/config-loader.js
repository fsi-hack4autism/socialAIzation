/**
 * Configuration loader that requires all values to be explicitly set
 */

// Get the current environment
if (!process.env.NODE_ENV) {
  throw new Error('Environment variable NODE_ENV is required but not set.');
}

const environment = process.env.NODE_ENV;

// Required environment variables for all environments
const requiredVars = [
  'BACKEND_URL',
  'FRONTEND_URL',
  'COSMOS_DB_NAME',
  'KEY_VAULT_NAME',
  'RESOURCE_GROUP'
];

// Ensure all required variables are set
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Environment variable ${varName} is required for ${environment} environment but not set.`);
  }
});

// Create config object from environment variables
const config = {
  [environment]: {
    backendUrl: process.env.BACKEND_URL,
    frontendUrl: process.env.FRONTEND_URL,
    cosmosDbName: process.env.COSMOS_DB_NAME,
    keyVaultName: process.env.KEY_VAULT_NAME,
    resourceGroup: process.env.RESOURCE_GROUP
  }
};

// Export the config
module.exports = config;
