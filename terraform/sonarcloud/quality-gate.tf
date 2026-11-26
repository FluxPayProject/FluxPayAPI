resource "sonarqube_cloud_quality_gate" "fluxpay_api" {
  organization = var.organization
  name         = var.quality_gate_name

  condition {
    metric    = "new_reliability_rating"
    operator  = "GT"
    threshold = "1"
  }

  condition {
    metric    = "new_security_rating"
    operator  = "GT"
    threshold = "1"
  }

  condition {
    metric    = "new_maintainability_rating"
    operator  = "GT"
    threshold = "1"
  }

  condition {
    metric    = "new_duplicated_lines_density"
    operator  = "GT"
    threshold = "3"
  }

  condition {
    metric    = "new_security_hotspots_reviewed"
    operator  = "LT"
    threshold = "100"
  }
}

resource "sonarqube_cloud_project_quality_gate" "fluxpay_api" {
  organization    = sonarqube_project.fluxpay_api.organization
  project_key     = sonarqube_project.fluxpay_api.key
  quality_gate_id = sonarqube_cloud_quality_gate.fluxpay_api.id
}
