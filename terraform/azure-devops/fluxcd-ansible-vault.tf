variable "ansible_vault_password" {
  description = "Password for the FluxCD AKS bootstrap Ansible Vault."
  type        = string
  sensitive   = true
  nullable    = false

  validation {
    condition     = length(trimspace(var.ansible_vault_password)) > 0
    error_message = "The Ansible Vault password must not be empty."
  }
}

resource "azuredevops_variable_group" "fluxcd_ansible_vault" {
  project_id   = var.project_id
  name         = "FluxCD_Ansible_Vault"
  description  = "Ansible Vault password for FluxCD provisioning on dev AKS."
  allow_access = false

  variable {
    name         = "ANSIBLE_VAULT_PASSWORD"
    is_secret    = true
    secret_value = var.ansible_vault_password
  }
}
