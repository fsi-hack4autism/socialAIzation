import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import config from '../config';
import logger from '../services/logger';
import vault from 'node-vault';

// Interface for all secret providers
interface SecretProvider {
  getSecret(secretName: string): Promise<string>;
}

// Environment variables based provider
class EnvSecretProvider implements SecretProvider {
  async getSecret(secretName: string): Promise<string> {
    return process.env[secretName] || '';
  }
}

// Azure Key Vault provider
class AzureKeyVaultProvider implements SecretProvider {
  private client: SecretClient | null = null;
  private secretCache: Map<string, string> = new Map();

  async initialize() {
    if (!config.secrets.azure.name) {
      logger.warn('Azure Key Vault name not provided, provider not initialized');
      return;
    }

    try {
      const credential = new DefaultAzureCredential();
      const url = `https://${config.secrets.azure.name}.vault.azure.net`;
      this.client = new SecretClient(url, credential);
      logger.info(`Azure Key Vault client initialized for ${url}`);
    } catch (error) {
      logger.error('Failed to initialize Azure Key Vault client', error);
      throw error;
    }
  }

  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    if (this.secretCache.has(secretName)) {
      return this.secretCache.get(secretName) as string;
    }

    if (!this.client) {
      await this.initialize();
      if (!this.client) {
        logger.warn(`Azure Key Vault not initialized, using environment variable for ${secretName}`);
        return process.env[secretName] || '';
      }
    }

    try {
      const secret = await this.client.getSecret(secretName);
      const value = secret.value || '';
      
      // Cache the secret
      this.secretCache.set(secretName, value);
      
      return value;
    } catch (error) {
      logger.error(`Failed to retrieve secret ${secretName} from Azure Key Vault`, error);
      throw error;
    }
  }
}

// HashiCorp Vault provider
class HashiCorpVaultProvider implements SecretProvider {
  private client: any = null;
  private secretCache: Map<string, string> = new Map();

  async initialize() {
    if (!config.secrets.vault.address) {
      logger.warn('HashiCorp Vault address not provided, provider not initialized');
      return;
    }

    try {
      this.client = vault({
        apiVersion: 'v1',
        endpoint: config.secrets.vault.address,
        token: config.secrets.vault.token
      });
      
      logger.info(`HashiCorp Vault client initialized for ${config.secrets.vault.address}`);
    } catch (error) {
      logger.error('Failed to initialize HashiCorp Vault client', error);
      throw error;
    }
  }

  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    if (this.secretCache.has(secretName)) {
      return this.secretCache.get(secretName) as string;
    }

    if (!this.client) {
      await this.initialize();
      if (!this.client) {
        logger.warn(`HashiCorp Vault not initialized, using environment variable for ${secretName}`);
        return process.env[secretName] || '';
      }
    }

    try {
      const path = `${config.secrets.vault.secretsPath}/${secretName}`;
      const { data } = await this.client.read(path);
      const value = data.value || '';
      
      // Cache the secret
      this.secretCache.set(secretName, value);
      
      return value;
    } catch (error) {
      logger.error(`Failed to retrieve secret ${secretName} from HashiCorp Vault`, error);
      throw error;
    }
  }
}

// Factory to create the appropriate provider
class SecretsManager {
  private provider: SecretProvider;
  
  constructor() {
    // Select the provider based on configuration
    switch (config.secrets.provider) {
      case 'azure':
        this.provider = new AzureKeyVaultProvider();
        break;
      case 'vault':
        this.provider = new HashiCorpVaultProvider();
        break;
      case 'env':
      default:
        this.provider = new EnvSecretProvider();
    }
  }

  async getSecret(secretName: string): Promise<string> {
    return this.provider.getSecret(secretName);
  }
}

const secretsManager = new SecretsManager();
export default secretsManager;
