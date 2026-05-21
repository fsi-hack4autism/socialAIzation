# Metaverse Social Practice - Backend API

## Setup and Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp ../.env.example .env.local
   # Edit .env.local with your configuration
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Dependencies

This project uses several key dependencies:

- **Express**: Web server framework
- **MongoDB**: Database driver for MongoDB-compatible databases
- **Node-Vault**: Client for HashiCorp Vault
- **Azure SDK**: For Azure Key Vault integration

## Environment Setup

For local development with MongoDB:
1. Install MongoDB locally or use MongoDB Atlas
2. Update the MongoDB connection string in your .env file

## Secret Management

The application supports multiple secret management options:

1. Environment Variables (default)
2. HashiCorp Vault
3. Azure Key Vault

To use HashiCorp Vault:
```
SECRETS_PROVIDER=vault
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your-token
VAULT_SECRETS_PATH=secret/metaverse-social
```

To use Azure Key Vault:
```
SECRETS_PROVIDER=azure
KEY_VAULT_NAME=your-vault-name
```
