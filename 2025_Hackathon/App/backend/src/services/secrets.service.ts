import { injectable, inject } from 'inversify';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import TYPES from '../di/types';
import { IConfig } from '../di/config';
import { ILoggerService } from './logger.service';

// Interface for all secret providers
export interface ISecretProvider {
  getSecret(secretName: string): Promise<string>;
}

// Environment variables based provider - the simplest and primary provider
@injectable()
export class EnvSecretProvider implements ISecretProvider {
  constructor(
    @inject(TYPES.LoggerService) private logger: ILoggerService
  ) {}

  async getSecret(secretName: string): Promise<string> {
    const value = process.env[secretName] || '';
    if (!value) {
      this.logger.warn(`Environment variable ${secretName} not found`);
    }
    return value;
  }
}

// Azure Key Vault provider
@injectable()
export class AzureKeyVaultProvider implements ISecretProvider {
  private client: SecretClient | null = null;
  private secretCache: Map<string, string> = new Map();
  private fallbackProvider: EnvSecretProvider;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.LoggerService) private logger: ILoggerService
  ) {
    this.fallbackProvider = new EnvSecretProvider(logger);
  }

  async initialize(): Promise<void> {
    if (!this.config.secrets.azure.name) {
      this.logger.warn('Azure Key Vault name not provided, will use environment variables');
      return;
    }

    try {
      const credential = new DefaultAzureCredential();
      const url = `https://${this.config.secrets.azure.name}.vault.azure.net`;
      this.client = new SecretClient(url, credential);
      this.logger.info(`Azure Key Vault client initialized for ${url}`);
    } catch (error) {
      this.logger.error('Failed to initialize Azure Key Vault client', error);
      this.logger.info('Falling back to environment variables for secrets');
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
        return this.fallbackProvider.getSecret(secretName);
      }
    }

    try {
      const secret = await this.client.getSecret(secretName);
      const value = secret.value || '';
      
      // Cache the secret
      this.secretCache.set(secretName, value);
      
      return value;
    } catch (error) {
      this.logger.error(`Failed to retrieve secret ${secretName} from Azure Key Vault`, error);
      return this.fallbackProvider.getSecret(secretName);
    }
  }
}

// Main Secrets Service
export interface ISecretsService {
  getSecret(secretName: string): Promise<string>;
}

@injectable()
export class SecretsService implements ISecretsService {
  private provider: ISecretProvider;
  
  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.LoggerService) private logger: ILoggerService,
    @inject(TYPES.SecretProvider) provider: ISecretProvider
  ) {
    this.provider = provider;
  }

  async getSecret(secretName: string): Promise<string> {
    return this.provider.getSecret(secretName);
  }
}
