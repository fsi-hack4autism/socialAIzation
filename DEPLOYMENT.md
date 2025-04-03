# Local Deployment

To run locally:

```
cd socialAIzation
cp env.example .env
docker compose build
docker compose up
```

This will provide the following endpoints:
* UI -  http://localhost:5000/
* API - Example: http://localhost:5001/api/scenarios
* Conversation API - http://localhost:5002/docs

To deploy to Azure via Tofu:

```
cd infra/azure/opentofu

# Copy the example
cp example-backend-configs/backend-dev.conf backend-dev.conf
# Replace with your own configurations (e.g. storage accounts are globally unique)

tofu plan -var-file backend-dev.conf
# Verify no errors or warnings

tofu apply -var-file backend-dev.conf

# Cleanup 
tofu destroy -var-file backend-dev.conf
```

