# SonarCloud quality gate

This Terraform root manages the existing `FluxPayAPI` quality gate and its
assignment to `FluxPayProject_FluxPayAPI` in `fluxpayproject`. The gate uses
the five conditions already configured in SonarCloud.

- Reliability, security and maintainability ratings of A on new code.
- At most 3% duplicated lines in new code.
- All new security hotspots reviewed.

## Run locally

Requires Terraform 1.16+, access to the Azure Blob state container and a
SonarCloud user token with **Administer Quality Gates** permission in
`fluxpayproject`. The organization needs a plan that supports custom quality
gates. See [SonarCloud's custom gate requirements](https://docs.sonarsource.com/sonarqube-cloud/standards/managing-quality-gates/managing-custom-quality-gates).

From the repository root:

```bash
cd terraform/sonarcloud
export ARM_SAS_TOKEN="<state container SAS token>"
export SONARCLOUD_TOKEN="<SonarCloud administrator's user token>"

terraform init
terraform fmt -check
terraform validate
terraform plan -out=sonarcloud.tfplan
```

With empty state, the first plan imports `FluxPayAPI` by name and records the
project assignment. The provider applies the existing assignment when it first
records it in state.

Apply the reviewed plan and check that the next plan reports no changes:

```bash
terraform apply sonarcloud.tfplan
terraform plan
```

Confirm that the project uses `FluxPayAPI` under **Project Settings > Quality
Gate** in SonarCloud. The next Build Auth analysis on `develop` will report the
result for that gate.
