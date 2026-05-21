# Deployment Guide

This document covers the deployment process for the Metaverse Social Practice application across different environments.

## Environment Configuration

The application supports multiple deployment environments:
- **Development**: Local development environment
- **QA**: Testing and quality assurance environment
- **Production**: Live production environment

## Prerequisites

- Azure CLI installed and configured
- Access to the Azure subscription
- Appropriate permissions to create and modify resources
- Node.js and npm
- OpenTofu/Terraform installed

## Infrastructure Deployment

### 1. Prepare Environment Variables

Create a `terraform.tfvars` file for environment-specific values:

```hcl
environment = "dev"  # or "qa", "prod"
allowed_ip_ranges = ["123.123.123.123/32"]  # Your IP addresses that need Key Vault access
```

### 2. Deploy Infrastructure

Deploy all infrastructure resources including Key Vault:

```bash
# Initialize Terraform/OpenTofu
tofu init

# Plan the deployment
tofu plan -var-file=terraform.tfvars

# Apply the infrastructure changes
tofu apply -var-file=terraform.tfvars
```

This will create all necessary resources including:
- Resource group
- Key Vault with required secrets
- CosmosDB account and databases
- Web Apps for frontend and backend
- Network configuration
- Access policies

### 3. Environment Variables

For local development:
1. Copy `.env.example` to `.env.local`
2. Update the values according to your environment

For Azure deployments:
- Application settings are automatically configured by the infrastructure deployment
- Key Vault integration is set up with managed identities

## Deployment Process

### Backend Deployment

1. Build the backend application:
   ```bash
   cd App/backend
   npm install
   npm run build
   ```

2. Deploy to Azure Web App:
   ```bash
   # Deploy using zip deployment
   zip -r backend.zip dist node_modules package.json
   az webapp deployment source config-zip --resource-group mvsp-$ENV_NAME-rg \
     --name mvsp-$ENV_NAME-api --src backend.zip
   ```

### Frontend Deployment

1. Build the frontend application with environment-specific configuration:
   ```bash
   cd App/frontend
   npm install
   NEXT_PUBLIC_API_URL=$(jq -r ".$ENV_NAME.backendUrl" ../deployment/env-config.json) npm run build
   ```

2. Deploy to Azure Web App:
   ```bash
   # Deploy using zip deployment
   zip -r frontend.zip .next public package.json
   az webapp deployment source config-zip --resource-group mvsp-$ENV_NAME-rg \
     --name mvsp-$ENV_NAME --src frontend.zip
   ```

## Verification

After deployment, verify the application is working correctly:

1. Check that the frontend can connect to the backend API
2. Verify database connections are working
3. Test authentication flows
4. Check logs for any errors

## Rollback Procedure

If issues are encountered:

1. Identify the problem through logs and monitoring
2. Redeploy the previous known-good version
3. If infrastructure changes were made, use `tofu plan` to review and then `tofu apply` to rollback
4. If database changes were made, restore from backup if necessary
