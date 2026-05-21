import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment determination
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

/**
 * Gets a required environment variable or throws an error
 * @param key The environment variable key
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not provided`);
  }
  
  return value;
}

// Connection configurations
const config = {
  env: nodeEnv,
  isProduction,
  
  server: {
    port: parseInt(getRequiredEnv('PORT'), 10),
    cors: {
      origin: getRequiredEnv('CORS_ORIGIN'),
      credentials: true
    }
  },
  
  // MongoDB compatible configuration (works with any MongoDB-compatible database)
  mongodb: {
    connectionString: getRequiredEnv('MONGODB_CONNECTION_STRING'),
    databaseName: getRequiredEnv('MONGODB_DATABASE_NAME'),
    userCollection: getRequiredEnv('MONGODB_USER_COLLECTION'),
    scenarioCollection: getRequiredEnv('MONGODB_SCENARIO_COLLECTION'),
    sessionCollection: getRequiredEnv('MONGODB_SESSION_COLLECTION'),
    interactionCollection: getRequiredEnv('MONGODB_INTERACTION_COLLECTION')
  },
  
  auth: {
    jwtSecret: getRequiredEnv('JWT_SECRET'),
    tokenExpiry: getRequiredEnv('JWT_EXPIRY'),
    azureAd: {
      clientId: getRequiredEnv('AZURE_AD_CLIENT_ID'),
      tenantId: getRequiredEnv('AZURE_AD_TENANT_ID'),
      clientSecret: getRequiredEnv('AZURE_AD_CLIENT_SECRET'),
      redirectUri: getRequiredEnv('AZURE_AD_REDIRECT_URI')
    }
  },
  
  // Platform-agnostic secrets management
  secrets: {
    provider: getRequiredEnv('SECRETS_PROVIDER'),
    
    // HashiCorp Vault configuration
    vault: {
      address: getRequiredEnv('VAULT_ADDR'),
      token: getRequiredEnv('VAULT_TOKEN'),
      secretsPath: getRequiredEnv('VAULT_SECRETS_PATH')
    },
    
    // Azure Key Vault (backwards compatibility)
    azure: {
      name: getRequiredEnv('KEY_VAULT_NAME'),
      clientId: getRequiredEnv('KEY_VAULT_CLIENT_ID'),
      clientSecret: getRequiredEnv('KEY_VAULT_CLIENT_SECRET'),
      tenantId: getRequiredEnv('KEY_VAULT_TENANT_ID')
    }
  }
};

export default config;