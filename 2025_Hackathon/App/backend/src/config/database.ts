import { MongoClient, MongoClientOptions } from 'mongodb';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

// Global reference to the in-memory server
let mongoMemoryServer: MongoMemoryServer | null = null;
let client: MongoClient | null = null;

// Get the MongoDB URI from environment, otherwise use in-memory database
const getMongoUri = async (): Promise<string> => {
  // First check if a MongoDB URI is provided in environment variables
  if (process.env.MONGODB_URI) {
    console.log('Using provided MongoDB connection string from environment');
    return process.env.MONGODB_URI;
  }

  // If not, create an in-memory MongoDB server
  console.log('No MongoDB URI provided, using in-memory database');
  mongoMemoryServer = await MongoMemoryServer.create();
  const uri = mongoMemoryServer.getUri();
  console.log(`In-memory MongoDB started at: ${uri}`);
  return uri;
};

// Configure MongoDB options based on connection type
const getMongoOptions = (uri: string): MongoClientOptions => {
  // Base options
  const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 5000,
  };

  // Add Cosmos DB-specific options if connecting to Azure
  if (uri.includes('cosmos.azure.com')) {
    console.log('Azure Cosmos DB detected, applying specific configuration');
    Object.assign(options, {
      retryWrites: false,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  return options;
};

export const connectToDatabase = async (): Promise<MongoClient> => {
  try {
    const uri = await getMongoUri();
    const options = getMongoOptions(uri);
    
    console.log(`Connecting to MongoDB (${uri.includes('cosmos.azure.com') ? 'Azure Cosmos DB' : 
                  uri.includes('mongodb-memory-server') ? 'In-Memory' : 'Standard MongoDB'})...`);
    
    client = new MongoClient(uri, options);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// For clean app shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  
  // Shutdown in-memory server if it was used
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    console.log('In-memory MongoDB server stopped');
  }
};