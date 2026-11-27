terraform {
  required_version = ">= 1.16.0"

  required_providers {
    sonarqube = {
      source  = "sonarsource/sonarqube"
      version = "= 0.1.0-alpha.6"
    }
  }

  backend "azurerm" {}
}
