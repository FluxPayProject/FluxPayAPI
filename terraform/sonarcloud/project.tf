resource "sonarqube_project" "fluxpay_api" {
  organization = var.organization
  key          = var.project_key
  name         = var.project_name
  main_branch  = var.main_branch
}
