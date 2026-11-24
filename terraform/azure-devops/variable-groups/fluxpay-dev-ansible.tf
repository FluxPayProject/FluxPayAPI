variable "flux_bootstrap_vars_base64" {
  description = "Base64-encoded Ansible extra-vars YAML for the FluxPay dev bootstrap."
  type        = string
  sensitive   = true
  nullable    = false

  validation {
    condition     = try(length(trimspace(base64decode(var.flux_bootstrap_vars_base64))) > 0, false)
    error_message = "flux_bootstrap_vars_base64 must contain non-empty UTF-8 YAML encoded as base64."
  }
}

resource "azuredevops_variable_group" "fluxpay_dev_ansible" {
  project_id   = var.project_id
  name         = "FluxPay_Dev_Ansible"
  description  = "Ansible extra-vars for bootstrapping Flux on the dev AKS cluster."
  allow_access = false

  variable {
    name         = "flux-bootstrap-vars-base64"
    is_secret    = true
    secret_value = var.flux_bootstrap_vars_base64
  }
}
