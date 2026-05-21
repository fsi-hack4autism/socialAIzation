# Infra

This directory is intended to be a refactor of the infrastructure directory.  I'm starting from scratch and it's easier than trying to modify the infrastructure directory and bring in the files that are really needed.

## Getting Started

1. Deploy Infrastructure manually (via CLI, this should only need to be done once)
2. Setup GH Actions to auto-deploy upon change

## Deploy Infra (manually)

```
cd infra/azure/opentofu

# Copy the example
cp example-backend-configs/backend-dev.conf backend-dev.conf
# Replace with your own configurations (e.g. storage accounts are globally unique)

tofu plan -var-file backend-dev.conf
# Verify no errors or warnings

tofu apply -var-file backend-dev.conf

```

## Cleanup

```
tofu destroy -var-file backend-dev.conf
```
