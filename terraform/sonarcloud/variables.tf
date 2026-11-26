variable "organization" {
  description = "Key of the existing SonarQube Cloud organization."
  type        = string
  default     = "fluxpayproject"
}

variable "project_key" {
  description = "SonarQube Cloud project key used by the analysis pipeline."
  type        = string
  default     = "FluxPayProject_FluxPayAPI"
}

variable "project_name" {
  description = "Display name of the SonarQube Cloud project."
  type        = string
  default     = "FluxPayAPI"
}

variable "quality_gate_name" {
  description = "Name of the custom quality gate assigned to the project."
  type        = string
  default     = "FluxPayAPI"
}

variable "main_branch" {
  description = "Main branch of the SonarQube Cloud project."
  type        = string
  default     = "develop"
}

variable "github_repository" {
  description = "GitHub repository to bind in owner/name format."
  type        = string
  default     = "FluxPayProject/FluxPayAPI"
}
