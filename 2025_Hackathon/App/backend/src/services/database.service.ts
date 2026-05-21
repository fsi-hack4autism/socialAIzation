import { injectable, inject } from 'inversify';
import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import TYPES from '../di/types';
import { IConfig } from '../di/config';
import { ILoggerService } from './logger.service';

export interface IDatabaseService {
  init(): Promise<boolean>;
  getCollection(collectionName: string): Collection;
  getDatabase(): Db;
  close(): Promise<void>;
}

@injectable()
export class DatabaseService implements IDatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collections: Map<string, Collection> = new Map();
  private mongoMemoryServer: MongoMemoryServer | null = null;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.LoggerService) private logger: ILoggerService
  ) {}

  async init(): Promise<boolean> {
    try {
      const { uri } = await this.getConnectionDetails();
      const options = this.getMongoOptions(uri);
      
      this.logger.info(`Initializing database connection to MongoDB (${this.getDatabaseType(uri)})`);
      
      // Create a MongoDB client
      this.client = new MongoClient(uri, options);
      
      // Connect to the MongoDB server
      await this.client.connect();
      
      // Get database reference
      this.db = this.client.db(this.config.mongodb.databaseName);
      
      // Initialize collections
      await this.initCollection(this.config.mongodb.userCollection);
      await this.initCollection(this.config.mongodb.scenarioCollection);
      await this.initCollection(this.config.mongodb.sessionCollection);
      await this.initCollection(this.config.mongodb.interactionCollection);
      
      this.logger.info('Database connection initialized successfully');
      return true;
    } catch (err) {
      this.logger.error('Failed to initialize database connection', err);
      throw err;
    }
  }

  private async getConnectionDetails(): Promise<{ uri: string }> {
    const connectionString = this.config.mongodb.connectionString;
    
    // If a connection string is provided, use it
    if (connectionString && connectionString.trim() !== '') {
      this.logger.info(`Using provided MongoDB connection string: ${connectionString}`);
      return { uri: connectionString };
    }
    
    // Otherwise, create an in-memory MongoDB server for development/testing
    this.logger.info('No MongoDB URI provided, using in-memory database');
    this.mongoMemoryServer = await MongoMemoryServer.create();
    const uri = this.mongoMemoryServer.getUri();
    this.logger.info(`In-memory MongoDB started at: ${uri}`);
    
    return { uri };
  }

  private getMongoOptions(uri: string): MongoClientOptions {
    // Base options
    const options: MongoClientOptions = {
      serverSelectionTimeoutMS: 5000,
    };

    // Add Cosmos DB-specific options if connecting to Azure
    if (uri.includes('cosmos.azure.com')) {
      this.logger.info('Azure Cosmos DB detected, applying specific configuration');
      Object.assign(options, {
        retryWrites: false,
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    return options;
  }

  private getDatabaseType(uri: string): string {
    if (uri.includes('cosmos.azure.com')) {
      return 'Azure Cosmos DB';
    } else if (uri.includes('mongodb-memory-server')) {
      return 'In-Memory';
    } else {
      return 'Standard MongoDB';
    }
  }

  private async initCollection(collectionName: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const collection = this.db.collection(collectionName);
    this.collections.set(collectionName, collection);
    this.logger.info(`Collection initialized: ${collectionName}`);
  }

  getCollection(collectionName: string): Collection {
    const collection = this.collections.get(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} not found`);
    }
    return collection;
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.logger.info('Database connection closed');
    }
    
    // Shutdown in-memory server if it was used
    if (this.mongoMemoryServer) {
      await this.mongoMemoryServer.stop();
      this.logger.info('In-memory MongoDB server stopped');
    }
  }
}
