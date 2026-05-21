import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import config from '../config';
import logger from '../services/logger';

class KeyVaultClient {
  private client: SecretClient | null = null;
  private secretCache: Map<string, string> = new Map();

  async initialize() {
    if (!config.secrets.azure.name) {
      logger.warn('Key Vault name not provided, skipping initialization');
      return;
    }

    try {
      const credential = new DefaultAzureCredential();
      const url = `https://${config.secrets.azure.name}.vault.azure.net`;
      this.client = new SecretClient(url, credential);
      logger.info(`Key Vault client initialized for ${url}`);
    } catch (error) {
      logger.error('Failed to initialize Key Vault client', error);
      throw error;
    }
  }

  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    if (this.secretCache.has(secretName)) {
      return this.secretCache.get(secretName) as string;
    }

    // If Key Vault is not configured, return environment variable
    if (!this.client) {
      logger.warn(`Key Vault not initialized, using environment variable for ${secretName}`);
      return process.env[secretName] || '';
    }

    try {
      const secret = await this.client.getSecret(secretName);
      const value = secret.value || '';
      
      // Cache the secret
      this.secretCache.set(secretName, value);
      
      return value;
    } catch (error) {
      logger.error(`Failed to retrieve secret ${secretName}`, error);
      throw error;
    }
  }
}

const keyVaultClient = new KeyVaultClient();
export default keyVaultClient;
