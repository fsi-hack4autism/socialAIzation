import { MongoClient, Db, Collection } from 'mongodb';
import config from '../config';
import logger from './logger';

class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collections: Map<string, Collection> = new Map();

  constructor() {
    // Connection is initialized in init() method
  }

  async init() {
    try {
      const connectionString = config.mongodb.connectionString;
      logger.info(`Initializing database connection to MongoDB`);
      
      // Create a MongoDB client
      this.client = new MongoClient(connectionString);
      
      // Connect to the MongoDB server
      await this.client.connect();
      
      // Get database reference
      this.db = this.client.db(config.mongodb.databaseName);
      
      // Initialize collections
      await this.initCollection(config.mongodb.userCollection);
      await this.initCollection(config.mongodb.scenarioCollection);
      await this.initCollection(config.mongodb.sessionCollection);
      await this.initCollection(config.mongodb.interactionCollection);
      
      logger.info('Database connection initialized successfully');
      return true;
    } catch (err) {
      logger.error('Failed to initialize database connection', err);
      throw err;
    }
  }

  private async initCollection(collectionName: string) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const collection = this.db.collection(collectionName);
    this.collections.set(collectionName, collection);
    logger.info(`Collection initialized: ${collectionName}`);
  }

  getCollection(collectionName: string): Collection {
    const collection = this.collections.get(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} not found`);
    }
    return collection;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      logger.info('Database connection closed');
    }
  }
}

// Singleton instance
const databaseService = new DatabaseService();
export default databaseService;
