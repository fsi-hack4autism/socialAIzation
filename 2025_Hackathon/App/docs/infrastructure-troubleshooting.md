# Infrastructure Troubleshooting Guide

This document provides solutions to common issues encountered with the Azure infrastructure deployment.

## Azure Web App Configuration Issues

### Error: Invalid combination of arguments in application_stack

When configuring `azurerm_linux_web_app` resources, you can only specify one application stack technology at a time. 
The following options are mutually exclusive:

- docker_image
- docker_image_name
- dotnet_version
- go_version
- java_version
- node_version
- php_version
- python_version
- ruby_version

**Solution:**

Choose only one technology stack based on your deployment method:

```terraform
# For Docker-based deployment:
application_stack {
  docker_image_name = "your-image-name"
  docker_image_tag = "tag"
}

# For .NET-based deployment:
application_stack {
  dotnet_version = "7.0"
}

# For Node.js-based deployment:
application_stack {
  node_version = "18-lts"
}
```

## Other Common Issues

### Resource Naming Conflicts

Azure resource names must be globally unique for certain resource types like storage accounts and app service names.

**Solution:**

Use a naming convention that includes unique identifiers, such as:
- Project abbreviation
- Environment (dev, test, prod)
- Random suffix (can be generated with the random provider)

Example:
```terraform
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_storage_account" "example" {
  name = "mvsp${var.environment}${random_string.suffix.result}"
  # Other configuration...
}
```
