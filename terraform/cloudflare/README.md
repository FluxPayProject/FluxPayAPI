# Cloudflare DNS Terraform

The dev root `environments/dev` manages the `A` record
`fluxpay.razumovsky.me` in the existing Cloudflare zone. `traefik_public_ip`
defaults to the address in `variables.tf`. Set it to the current IPv4 of the
Traefik LoadBalancer when running Terraform locally.

## Run locally

Use a Cloudflare API token restricted to the `razumovsky.me` zone with DNS
read/edit access. Zone read access is only needed if discovering the zone ID.

From the repository root:

```bash
cd terraform/cloudflare/environments/dev
export CLOUDFLARE_API_TOKEN="<Cloudflare token>"
export TF_VAR_traefik_public_ip="<Traefik public IPv4>"
```

Create the ignored `backend.hcl` locally:

```hcl
storage_account_name = "tfstatestorage011"
container_name       = "tfstatecontainer01"
key                  = "cloudflare-dev.tfstate"
sas_token            = "<backend SAS token>"
```

Keep this state separate from Azure infrastructure's `azure.tfstate`.

```bash
terraform init -backend-config=backend.hcl
terraform fmt -check -recursive ../..
terraform validate
terraform plan -out=cloudflare.tfplan
```

Review the record/IP change, then apply:

```bash
terraform apply cloudflare.tfplan
```

If an existing record is not yet in state, inspect its ID and import it once
before planning; do not create a duplicate:

```bash
terraform import cloudflare_dns_record.application '<zone-id>/<dns-record-id>'
```

## Pipeline

Successful **FluxCD Ansible** runs from `develop` trigger **Cloudflare DNS**.
Terraform plans and applies the A record using the Traefik IPv4 published by
that Ansible run. The Cloudflare token comes from `Cloudflare_API_Key`.

PRs to `main` run a plan, and qualifying runs from `main` can apply. These runs
use the default address from `variables.tf`.
