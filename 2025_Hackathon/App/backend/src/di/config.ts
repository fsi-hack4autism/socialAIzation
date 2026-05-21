import * as dotenv from 'dotenv';
import { injectable } from 'inversify';

// Load environment variables from .env file
dotenv.config();

// Function to require environment variable or throw
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }
  return value;
}

// Environment types
export type Environment = 'development' | 'test' | 'qa' | 'production';

// Configuration interface
export interface IConfig {
  env: Environment;
  isProduction: boolean;
  server: {
    port: number;
    cors: {
      origin: string;
      credentials: boolean;
    };
  };
  mongodb: {
    connectionString: string;
    databaseName: string;
    userCollection: string;
    scenarioCollection: string;
    sessionCollection: string;
    interactionCollection: string;
  };
  auth: {
    jwtSecret: string;
    tokenExpiry: string;
  };
  secrets: {
    provider: 'env' | 'azure';
    azure: {
      name: string;
    };
  };
}

@injectable()
export class Config implements IConfig {
  readonly env: Environment;
  readonly isProduction: boolean;
  readonly server: {
    port: number;
    cors: {
      origin: string;
      credentials: boolean;
    };
  };
  readonly mongodb: {
    connectionString: string;
    databaseName: string;
    userCollection: string;
    scenarioCollection: string;
    sessionCollection: string;
    interactionCollection: string;
  };
  readonly auth: {
    jwtSecret: string;
    tokenExpiry: string;
  };
  readonly secrets: {
    provider: 'env' | 'azure';
    azure: {
      name: string;
    };
  };

  constructor() {
    // Get environment from NODE_ENV
    const nodeEnv = requireEnv('NODE_ENV');
    this.env = nodeEnv as Environment;
    this.isProduction = nodeEnv === 'production';

    // Server configuration
    this.server = {
      port: parseInt(requireEnv('PORT'), 10),
      cors: {
        origin: requireEnv('CORS_ORIGIN'),
        credentials: true
      }
    };

    // MongoDB configuration
    this.mongodb = {
      connectionString: requireEnv('MONGODB_CONNECTION_STRING'),
      databaseName: requireEnv('MONGODB_DATABASE_NAME'),
      userCollection: requireEnv('MONGODB_USER_COLLECTION'),
      scenarioCollection: requireEnv('MONGODB_SCENARIO_COLLECTION'),
      sessionCollection: requireEnv('MONGODB_SESSION_COLLECTION'),
      interactionCollection: requireEnv('MONGODB_INTERACTION_COLLECTION')
    };

    // Auth configuration
    this.auth = {
      jwtSecret: requireEnv('JWT_SECRET'),
      tokenExpiry: requireEnv('JWT_EXPIRY')
    };

    // Secrets management configuration
    this.secrets = {
      provider: requireEnv('SECRETS_PROVIDER') as 'env' | 'azure',
      azure: {
        name: requireEnv('KEY_VAULT_NAME')
      }
    };
  }
}
