import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const azureConfig = {
  resourceGroup: process.env.AZURE_RESOURCE_GROUP || 'default-resource-group',
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT || 'defaultstorage',
  location: process.env.AZURE_LOCATION || 'eastus',
  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
};

export default azureConfig;
