// Define symbols for DI bindings
const TYPES = {
  // Config
  Config: Symbol.for('Config'),
  Environment: Symbol.for('Environment'),
  
  // Services
  LoggerService: Symbol.for('LoggerService'),
  DatabaseService: Symbol.for('DatabaseService'),
  SecretsManager: Symbol.for('SecretsManager'),
  ScenarioService: Symbol.for('ScenarioService'),
  ScenarioManagementService: Symbol.for('ScenarioManagementService'),
  
  // Resources
  MongoClient: Symbol.for('MongoClient'),
  Database: Symbol.for('Database'),
  
  // Providers
  SecretProvider: Symbol.for('SecretProvider'),
};

export default TYPES;
