provider "sonarcloud" {
  organization = "fluxpayproject"
}

resource "sonarcloud_quality_gate" "fluxpay_api" {
  name = "FluxPayAPI"

  conditions = [
    {
      metric = "new_reliability_rating"
      op     = "GT"
      error  = "1"
    },
    {
      metric = "new_security_rating"
      op     = "GT"
      error  = "1"
    },
    {
      metric = "new_maintainability_rating"
      op     = "GT"
      error  = "1"
    },
    {
      metric = "new_duplicated_lines_density"
      op     = "GT"
      error  = "3"
    },
    {
      metric = "new_security_hotspots_reviewed"
      op     = "LT"
      error  = "100"
    },
  ]
}

import {
  to = sonarcloud_quality_gate.fluxpay_api
  id = "FluxPayAPI"
}

resource "sonarcloud_quality_gate_selection" "fluxpay_api" {
  gate_id      = sonarcloud_quality_gate.fluxpay_api.id
  project_keys = ["FluxPayProject_FluxPayAPI"]
}
