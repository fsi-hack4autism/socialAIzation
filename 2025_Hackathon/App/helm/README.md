# Metaverse Social Practice Helm Chart

This Helm chart deploys the Metaverse Social Practice application, consisting of a backend API service and a frontend React application.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- Ingress controller (like NGINX Ingress Controller)
- Cert Manager (optional, for TLS)

## Installing the Chart

First, make sure you have added any required Docker images to your registry:

```bash
# Build and push backend image
docker build -t <your-registry>/metaverse-social-backend:latest -f App/backend/Dockerfile .
docker push <your-registry>/metaverse-social-backend:latest

# Build and push frontend image
docker build -t <your-registry>/metaverse-social-frontend:latest -f App/frontend/Dockerfile .
docker push <your-registry>/metaverse-social-frontend:latest
```

Create a `values.yaml` file with your specific configuration or use the provided one:

```bash
helm install metaverse-social ./helm \
  --set global.imageRegistry=<your-registry> \
  --set backend.image.tag=<tag> \
  --set frontend.image.tag=<tag>
```

## Configuration

See `values.yaml` for configurable parameters. Key parameters include:

- `global.environment`: Environment name (prod, dev, test)
- `global.imageRegistry`: Container registry for images
- `backend.image.tag` and `frontend.image.tag`: Image versions to deploy
- `backend.ingress.hosts` and `frontend.ingress.hosts`: Hostnames for services

## Upgrading the Chart

```bash
helm upgrade metaverse-social ./helm \
  --set backend.image.tag=<new-tag> \
  --set frontend.image.tag=<new-tag>
```

## Uninstalling the Chart

```bash
helm uninstall metaverse-social
```

## Notes for Production

1. Replace the secrets with proper secret management (Azure Key Vault, Sealed Secrets, etc.)
2. Set up proper monitoring and logging
3. Consider separate Helm releases for different environments
