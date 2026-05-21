# Backend Configuration Guide

## Environment Variables

The application uses a strict fail-fast configuration approach. All environment variables must be properly set or the application will throw an error at startup. There are no fallbacks or default values in any environment.

### Required Environment Variables

You must create a `.env` file in the root directory with all required variables. A template file `env-template.txt` is provided in the backend directory - you can copy this file to `.env` and fill in the appropriate values.

```
# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000

# MongoDB Configuration
MONGODB_CONNECTION_STRING=mongodb://localhost:27017
MONGODB_DATABASE_NAME=metaverse-social
MONGODB_USER_COLLECTION=users
MONGODB_SCENARIO_COLLECTION=scenarios
MONGODB_SESSION_COLLECTION=sessions
MONGODB_INTERACTION_COLLECTION=interactions

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=1d

# Azure AD (if using)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_REDIRECT_URI=your-redirect-uri

# Secrets Management
SECRETS_PROVIDER=env

# Vault Configuration (if using)
VAULT_ADDR=your-vault-address
VAULT_TOKEN=your-vault-token
VAULT_SECRETS_PATH=your-secrets-path

# Azure Key Vault (if using)
KEY_VAULT_NAME=your-key-vault-name
KEY_VAULT_CLIENT_ID=your-key-vault-client-id
KEY_VAULT_CLIENT_SECRET=your-key-vault-client-secret
KEY_VAULT_TENANT_ID=your-key-vault-tenant-id
```

## Configuration Behavior

The application uses a strict fail-fast approach to configuration:

1. All environment variables are strictly required in all environments (development, staging, production).
2. There are no default fallback values.
3. If any variable is missing, the application will throw an error at startup with a clear message.

This ensures that configuration issues are caught early and prevents the application from running with incomplete or incorrect configuration.
