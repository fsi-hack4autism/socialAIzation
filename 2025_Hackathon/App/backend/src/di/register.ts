import 'reflect-metadata';
import container from './container';
import TYPES from './types';
import { Config, IConfig } from './config';
import { LoggerService, ILoggerService } from '../services/logger.service';
import { 
  ISecretsService, 
  SecretsService, 
  ISecretProvider, 
  EnvSecretProvider, 
  AzureKeyVaultProvider
} from '../services/secrets.service';
import { IDatabaseService, DatabaseService } from '../services/database.service';
import { ScenarioService } from '../services/scenario.service';
import { ScenarioManagementService } from '../services/scenarioManagement.service';

/**
 * Register all dependencies in the container
 */
export function registerDependencies(): void {
  // Register config
  container.bind<IConfig>(TYPES.Config).to(Config).inSingletonScope();
  
  // Get environment from config for conditional bindings
  const config = container.get<IConfig>(TYPES.Config);
  
  // Register logger
  container.bind<ILoggerService>(TYPES.LoggerService).to(LoggerService).inSingletonScope();
  
  // Register secret provider based on configuration
  registerSecretProvider(config);
  
  // Register secrets service
  container.bind<ISecretsService>(TYPES.SecretsManager).to(SecretsService).inSingletonScope();
  
  // Register database service
  container.bind<IDatabaseService>(TYPES.DatabaseService).to(DatabaseService).inSingletonScope();
  
  // Register application services
  registerApplicationServices();
  
  console.log('All dependencies registered successfully');
}

/**
 * Register the appropriate secret provider based on configuration
 */
function registerSecretProvider(config: IConfig): void {
  switch (config.secrets.provider) {
    case 'azure':
      container.bind<ISecretProvider>(TYPES.SecretProvider).to(AzureKeyVaultProvider).inSingletonScope();
      break;
    case 'env':
    default:
      container.bind<ISecretProvider>(TYPES.SecretProvider).to(EnvSecretProvider).inSingletonScope();
  }
}

/**
 * Register all application-specific services
 */
function registerApplicationServices(): void {
  // Register scenario services
  container.bind<ScenarioService>(TYPES.ScenarioService).to(ScenarioService).inSingletonScope();
  container.bind<ScenarioManagementService>(TYPES.ScenarioManagementService).to(ScenarioManagementService).inSingletonScope();
}

/**
 * Initialize all services that require async initialization
 */
export async function initializeServices(): Promise<void> {
  const logger = container.get<ILoggerService>(TYPES.LoggerService);
  logger.info('Initializing services...');
  
  // Initialize database
  await initializeDatabaseService(logger);
  
  // Initialize scenario services
  await initializeApplicationServices(logger);
  
  logger.info('All services initialized successfully');
}

/**
 * Initialize database service
 */
async function initializeDatabaseService(logger: ILoggerService): Promise<void> {
  try {
    const databaseService = container.get<IDatabaseService>(TYPES.DatabaseService);
    await databaseService.init();
  } catch (error) {
    logger.error('Failed to initialize database service', error);
    throw error;
  }
}

/**
 * Initialize application-specific services
 */
async function initializeApplicationServices(logger: ILoggerService): Promise<void> {
  try {
    const scenarioService = container.get<ScenarioService>(TYPES.ScenarioService);
    scenarioService.initialize();
    
    const scenarioManagementService = container.get<ScenarioManagementService>(TYPES.ScenarioManagementService);
    scenarioManagementService.initialize();
  } catch (error) {
    logger.error('Failed to initialize application services', error);
    throw error;
  }
}
