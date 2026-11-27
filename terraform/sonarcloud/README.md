# SonarQube Cloud project and quality gate

This Terraform root manages the project, its GitHub repository binding, the
custom quality gate and its assignment in the existing SonarQube Cloud
organization. The defaults match the Build Auth pipeline in Azure DevOps.

- Organization: `fluxpayproject`
- Project key: `FluxPayProject_FluxPayAPI`
- Project and quality gate name: `FluxPayAPI`
- Main branch: `develop`
- GitHub repository: `FluxPayProject/FluxPayAPI`

The gate requires A ratings for reliability, security and maintainability on
new code, at most 3% duplicated lines, and review of all new security hotspots.

## Initialize

Use Terraform 1.16+, Bash, curl and jq. The SonarQube Cloud organization needs
the Team or Enterprise plan for a custom gate assignment. Use a SonarQube Cloud
**user token** with **Create Projects**, **Administer Quality Gates** and
administrative access to the project it manages.

From the repository root:

```bash
cd terraform/sonarcloud
export SONARQUBE_TOKEN="<SonarQube Cloud user token>"
```

Create the ignored `backend.hcl` locally.

```hcl
storage_account_name = "tfstatestorage011"
container_name       = "tfstatecontainer01"
key                  = "sonarcloud-fluxpay.tfstate"
sas_token            = "<Azure state container SAS token>"
```

```bash
./init.sh
terraform validate
```

`init.sh` passes the local `backend.hcl` to `terraform init -backend-config`
and installs the pinned
[SonarSource provider](https://github.com/SonarSource/terraform-provider-sonarqube/releases/tag/v0.1.0-alpha.6)
from its GitHub release. Terraform checks the package against
`.terraform.lock.hcl`. For an existing checkout
previously initialized with backend settings in `versions.tf`, run
`./init.sh -reconfigure` once. Keep the state key from the example to use the
existing SonarQube Cloud state.

FluxPayAPI is tracked in the configured Azure state. Use `terraform plan` and
`terraform apply` for routine changes.

## Create a project from scratch

Run this against an empty state with a project key and gate name that are
available in the organization. For an additional project alongside FluxPayAPI,
initialize a separate backend key, for example
`./init.sh -reconfigure -backend-config=key=sonarcloud-new-project.tfstate`.
Set `organization`, `project_key`, `project_name`, `quality_gate_name`,
`main_branch` and `github_repository` as needed. The SonarQube Cloud
organization's GitHub App needs access to the repository. Use a repository
that is available to bind when creating an additional SonarQube Cloud project.
Build Auth analyzes the `develop` branch.

```bash
terraform plan -out=sonarcloud.tfplan
terraform apply sonarcloud.tfplan
```

The initial apply creates the project, binds it to GitHub, configures the
custom gate and assigns it to the project. For Azure DevOps analysis, configure
the scanner service connection in the
[Azure DevOps Terraform root](../azure-devops/README.md#sonarcloud).
The scanner organization and project key must match this configuration.

## Change the gate

Edit a `condition` in [quality-gate.tf](quality-gate.tf), then run
`terraform plan -out=sonarcloud.tfplan`. A threshold edit should show one
in-place update of the gate. Apply the reviewed plan and run the analysis to
see the result with the new threshold. Terraform manages the complete set of
conditions, so conditions added in the SonarQube Cloud UI appear as removals
in the next plan.
