# VR Scenario Manager

This application allows users to manage and customize VR scenarios. It provides a web interface for scenario selection, customization, and session management.

## Project Structure

```
App/
├── backend/           # Node.js + Express API server
│   └── src/
│       ├── types/    # TypeScript type definitions
│       ├── models/   # MongoDB models
│       ├── routes/   # API routes
│       └── services/ # Business logic
│
└── frontend/         # Next.js web application
    └── src/
        ├── app/     # Next.js app router
        ├── components/
        └── lib/     # Shared utilities
```

## Core Entities

1. **User**: Represents a user of the system
2. **Scenario**: A VR scenario template with customization options
3. **Session**: An instance of a scenario with specific customizations
4. **Interaction**: Records of interactions within a session

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```

This will start both the backend server and frontend development server concurrently.

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS, React Query
- **Backend**: Node.js, Express.js, MongoDB
- **Language**: TypeScript
- **API**: REST with JSON
- **Cloud Infrastructure**: Azure (see [infrastructure documentation](../docs/azure-infrastructure.md))

## Running in Development Mode

To run the application in development mode:

1. Start the backend server:
   ```bash
   cd App/backend
   npm run dev
   ```

2. Start the frontend server:
   ```bash
   cd App/frontend
   npm run dev
   ```

Both servers will run concurrently, and you can access the frontend at `http://localhost:3000`.

## Running the Backend in Development Mode with .env Configuration

To ensure the backend picks up the `.env` file for configuration, follow these steps:

1. Create a `.env` file in the `App/backend` directory if it doesn't already exist. Add your environment variables, for example:
   ```
   MONGO_URI=mongodb://localhost:27017/vr_scenario_manager
   PORT=5000
   ```

2. Install the `dotenv` package if it's not already installed:
   ```bash
   cd App/backend
   npm install dotenv
   ```

3. Start the backend server in development mode:
   ```bash
   cd App/backend
   npm run dev
   ```

The backend will automatically load the `.env` file and use the specified configuration.

## Starting MongoDB with Docker

To start a MongoDB instance using Docker, run the following command:

```bash
docker run --name mongodb -d -p 27017:27017 -v mongodb_data:/data/db mongo
```

- `--name mongodb`: Names the container `mongodb`.
- `-d`: Runs the container in detached mode.
- `-p 27017:27017`: Maps port 27017 on your host to port 27017 in the container.
- `-v mongodb_data:/data/db`: Persists MongoDB data in a Docker volume named `mongodb_data`.

You can verify that MongoDB is running by connecting to it using a MongoDB client or by running:

```bash
docker logs mongodb
```

## Azure Resource Configuration

To make Azure resources configurable for different users or environments, use environment variables in your `.env` file:

1. Add Azure-specific configurations to your `.env` file:
   ```
   # Azure Configuration
   AZURE_RESOURCE_GROUP=your-resource-group
   AZURE_STORAGE_ACCOUNT=yourstorageaccount
   AZURE_LOCATION=eastus
   AZURE_SUBSCRIPTION_ID=your-subscription-id
   ```

2. Update your deployment scripts to use these environment variables instead of hardcoded values.

3. For different environments (development, staging, production), create separate `.env.development`, `.env.staging`, and `.env.production` files.

4. To switch between environments:
   ```bash
   # For development
   cp .env.development .env
   
   # For production
   cp .env.production .env
   ```

This approach allows team members to use their own Azure resources without changing the application code.

## Infrastructure as Code with OpenTofu/Terraform

The project uses OpenTofu (Terraform) to manage Azure infrastructure. The backend configuration is designed to be flexible across different environments.

### Initial Setup: Creating Storage for Remote State

Before you can use remote state storage, you need to create the Azure Storage Account manually (this is a one-time bootstrap process):

1. Log in to Azure CLI:
   ```bash
   az login
   ```

2. Create a resource group for your state storage:
   ```bash
   az group create --name dev-metaverse-social-rg --location eastus
   ```

3. Create a storage account (name must be globally unique):
   ```bash
   az storage account create --name devmetaversestorage --resource-group dev-metaverse-social-rg --sku Standard_LRS
   ```

4. Create a container for the state files:
   ```bash
   az storage container create --name tfstate --account-name devmetaversestorage
   ```

5. Get the storage account key (you'll need this for authentication):
   ```bash
   az storage account keys list --resource-group dev-metaverse-social-rg --account-name devmetaversestorage
   ```

6. Set environment variables for authentication:
   ```bash
   export ARM_ACCESS_KEY=<storage_account_key>
   ```

Repeat this process for each environment (dev, qa, prod) with appropriate naming.

### Setting Up Different Environments

To initialize OpenTofu/Terraform with environment-specific backend settings:

1. Create a backend configuration file for each environment, e.g., `backend-dev.conf`, `backend-qa.conf`, `backend-prod.conf`:

   ```
   # backend-dev.conf example
   resource_group_name  = "dev-metaverse-social-rg"
   storage_account_name = "devmetaversestorage"
   container_name       = "tfstate"
   ```

2. Initialize OpenTofu/Terraform with the specific backend configuration:

   ```bash
   cd App/infrastructure/azure/opentofu
   
   # For development
   terraform init -backend-config=backend-dev.conf
   
   # For QA
   terraform init -backend-config=backend-qa.conf
   
   # For production
   terraform init -backend-config=backend-prod.conf
   ```

3. Create a corresponding variables file for each environment (e.g., `dev.tfvars`, `qa.tfvars`, `prod.tfvars`) to provide environment-specific values for other resources.

4. Apply the configuration for the specific environment:

   ```bash
   terraform apply -var-file=dev.tfvars  # For development
   ```

This approach allows you to maintain separate state files for different environments while reusing the same infrastructure code.

## Deployment

To deploy the application:

1. Build the frontend:
   ```bash
   cd App/frontend
   npm run build
   ```

2. Build the backend:
   ```bash
   cd App/backend
   npm run build
   ```

3. Deploy the built artifacts to your cloud infrastructure (e.g., Azure). Refer to the [infrastructure documentation](../docs/azure-infrastructure.md) for detailed deployment steps.
