variable "environment" {
  description = "Deployment environment (dev, qa, prod)"
  type        = string
  default     = "dev"
}

variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access Key Vault"
  type        = list(string)
  default     = []
}

variable "secrets_provider" {
  description = "The secrets provider to use (env, vault, azure)"
  type        = string
  default     = "azure"
}

variable "vault_addr" {
  description = "HashiCorp Vault server address"
  type        = string
  default     = ""
}

variable "vault_token" {
  description = "HashiCorp Vault token (sensitive)"
  type        = string
  default     = ""
  sensitive   = true
}