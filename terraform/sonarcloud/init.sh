#!/usr/bin/env bash
set -euo pipefail

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
version="$(sed -n 's/^[[:space:]]*version[[:space:]]*=[[:space:]]*"= \([^"]*\)"$/\1/p' "$root/versions.tf")"
platform="$(terraform version -json | jq -er '.platform')"
archive="terraform-provider-sonarqube_${version}_${platform}.zip"

mirror="$root/.terraform/provider-mirror"
packages="$mirror/registry.terraform.io/sonarsource/sonarqube"
mkdir -p "$packages"

if [[ ! -f "$packages/$archive" ]]; then
  download="$(mktemp "$packages/download.XXXXXXXX")"
  trap 'rm -f -- "$download"' EXIT
  curl --fail --silent --show-error --location --retry 3 \
    "https://github.com/SonarSource/terraform-provider-sonarqube/releases/download/v${version}/${archive}" \
    --output "$download"
  mv -- "$download" "$packages/$archive"
fi

# Terraform verifies the release archive against the committed dependency lock.
terraform -chdir="$root" init -plugin-dir="$mirror" -lockfile=readonly "$@"
