# Variable groups

Terraform authorizes each group only for its active consumers under `.azdo/`.

## Terraform_Backend_StateFile_Settings

Used by Terraform Create, Terraform Destroy, Cloudflare DNS and Deploy FluxPay Dev:

- `library-storage-account`, `library-storage-container`: Azure backend location.
- `library-sas-token`: protected backend credential.
- `library-state-file`: `azure.tfstate`, used by the Azure infrastructure stages. Cloudflare uses
  the separate `cloudflare-dev.tfstate` key.

## Terraform_Azure_Credentials

Used by Terraform Create, Terraform Destroy and the Azure stage of Deploy FluxPay Dev:

- `library-client-id`, `library-subscription-id`, `library-tenant-id`.
- `library-client-secret`: protected service-principal secret.

These stages pass the group values to AzureRM through `ARM_*` variables.

## Cloudflare_API_Key

Used by Cloudflare DNS and the Cloudflare stage of Deploy FluxPay Dev. `cloudflare-api-key` supplies `CLOUDFLARE_API_TOKEN`.
The zone ID comes from the Cloudflare Terraform variable default.

## FluxPay_Dev_Ansible

The Flux stage of Deploy FluxPay Dev uses `flux-bootstrap-vars-base64` as its
protected Ansible extra-vars input.

Legacy AKS, prefix, PostgreSQL, Redis, Entra ID and tfvars-transformation groups
have no active `.azdo/` consumers. Required application/platform secrets belong
in the GitOps secret workflow, not restored legacy groups.
