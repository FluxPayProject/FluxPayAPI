# Azure infrastructure Terraform

The dev root `environments/dev` creates the AKS resource group and cluster, then
grants control-plane and kubelet identities `AcrPull` on existing registry
`acrsharedd01` in `rg-acr-d01`. The registry is not created or destroyed here.

ACR pull access remains available for internal/rollback images alongside the
Docker Hub migration. Log Analytics, Prometheus and Grafana are not managed here.

## Run locally

Authenticate with `az login`. From the repository root:

```bash
cd terraform
export TF_BACKEND_STORAGE_ACCOUNT_NAME="tfstatestorage011"
export TF_BACKEND_CONTAINER_NAME="tfstatecontainer01"
export TF_BACKEND_KEY="azure.tfstate"
export TF_BACKEND_SAS_TOKEN="<backend SAS token>"
./terraform-init.sh
./terraform-fmt.sh
./terraform-validate.sh
./terraform-plan.sh
```

Review the plan, then apply:

```bash
./terraform-apply.sh
```

Environment defaults are in `environments/dev/variables.tf`. Override them with
`TF_VAR_*` inputs when needed. Keep backend credentials and saved plans out of Git.

## State

The backend remains `tfstatestorage011/tfstatecontainer01/azure.tfstate`.
Retained resource addresses did not change during the directory move; no
`terraform state mv` is needed. Removed monitoring resources will be destroyed
if they still exist in state. Check for unintended AKS replacement before apply.

Use `terraform init -upgrade` only for a deliberate provider upgrade and review
the dependency lock-file change.

## One-click deployment

Register **Deploy FluxPay Dev** using the
[Azure DevOps Terraform root](../azure-devops). The pipeline
uses the existing Azure state storage, ACR, Cloudflare zone and GitOps
repository. Terraform uses the existing `Terraform_Azure_Credentials` group,
as in Terraform Create and Terraform Destroy. The `FluxPay` GitHub connection
needs read access to the Ansible repository. The Flux stage uses
`Azure_Connection` to retrieve AKS admin credentials.

Prepare an Ansible extra-vars YAML file outside Git. Use the GitOps deploy key
pair, verified GitHub SSH host keys and the age key for the GitOps SOPS recipient.
Set `TF_VAR_flux_bootstrap_vars_base64` from the file before applying the Azure
DevOps Terraform root. Terraform stores the value as a secret in **Library →
Variable groups → FluxPay_Dev_Ansible** and authorizes the deployment pipeline.
Keep access to the Terraform state restricted because it contains the value.

```yaml
fluxify_git_repository_url: ssh://git@github.com/FluxPayProject/fluxcd-repository.git
fluxify_git_repository_ref: refs/heads/master
fluxify_git_repository_path: clusters/aks
fluxify_git_repository_private_key: |
  <read-only GitOps deploy private key>
fluxify_git_repository_public_key: |
  <matching public key>
fluxify_git_repository_known_hosts: |
  <verified GitHub SSH host keys>
fluxify_age_key: |
  <matching SOPS age private key>
```

```bash
export TF_VAR_flux_bootstrap_vars_base64="$(base64 < /path/to/flux-bootstrap.yml | tr -d '\r\n')"
```

In Azure DevOps, select **Infrastructure → Deploy FluxPay Dev → Run pipeline**.
The **Azure** stage applies the infrastructure Terraform root and exports the
AKS name and resource group. **Flux** uses them to run Ansible and waits up to
15 minutes for the Traefik Kustomization to become Ready and the public
LoadBalancer to receive an IPv4 address. **Cloudflare** applies the DNS
Terraform root using that address as `traefik_public_ip`. A failed stage
blocks its downstream stages.
