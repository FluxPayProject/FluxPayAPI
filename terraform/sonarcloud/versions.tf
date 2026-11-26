terraform {
  required_version = ">= 1.16.0"

  required_providers {
    sonarcloud = {
      source  = "rewe-digital/sonarcloud"
      version = "0.5.2"
    }
  }

  backend "azurerm" {
    storage_account_name = "tfstatestorage011"
    container_name       = "tfstatecontainer01"
    key                  = "sonarcloud-fluxpay.tfstate"
  }
}
