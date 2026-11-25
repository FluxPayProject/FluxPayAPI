variable "fluxcd_ansible_github_pat" {
  description = "Read-only GitHub PAT for the FluxCD Ansible repository."
  type        = string
  sensitive   = true
  nullable    = false

  validation {
    condition     = length(trimspace(var.fluxcd_ansible_github_pat)) > 0
    error_message = "The FluxCD Ansible GitHub PAT must not be empty."
  }
}

resource "azuredevops_serviceendpoint_github" "fluxcd_ansible" {
  project_id            = var.project_id
  service_endpoint_name = "FluxCD_Ansible_GitHub"
  description           = "Read access to the FluxCD Ansible bootstrap repository."

  auth_personal {
    personal_access_token = var.fluxcd_ansible_github_pat
  }
}

resource "azuredevops_pipeline_authorization" "fluxcd_ansible_github" {
  project_id  = var.project_id
  resource_id = azuredevops_serviceendpoint_github.fluxcd_ansible.id
  type        = "endpoint"
  pipeline_id = azuredevops_build_definition.pipeline["fluxcd_ansible"].id
}
