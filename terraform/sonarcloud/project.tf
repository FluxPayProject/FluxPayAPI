resource "sonarqube_project" "fluxpay_api" {
  organization = var.organization
  key          = var.project_key
  name         = var.project_name
  main_branch  = var.main_branch
}

resource "sonarqube_cloud_project_binding" "fluxpay_api" {
  organization = sonarqube_project.fluxpay_api.organization
  project_key  = sonarqube_project.fluxpay_api.key
  repository   = var.github_repository
}
