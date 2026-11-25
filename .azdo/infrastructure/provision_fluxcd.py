"""Install FluxCD and publish the IPv4 address of the Traefik LoadBalancer."""

import ipaddress
import json
import os
from pathlib import Path
import subprocess
import tempfile


def main():
    env = os.environ.copy()
    password = env.pop("ANSIBLE_VAULT_PASSWORD", "")
    if not password or password == "$(ANSIBLE_VAULT_PASSWORD)":
        raise SystemExit("Set ANSIBLE_VAULT_PASSWORD in FluxCD_Ansible_Vault")

    cluster = env["AKS_CLUSTER_NAME"]
    artifact = Path(env["INGRESS_ARTIFACT"])

    with tempfile.TemporaryDirectory() as directory:
        kubeconfig = Path(directory) / "kubeconfig"
        password_file = Path(directory) / "vault-password"
        password_file.touch(mode=0o600)
        password_file.write_text(f"{password}\n", encoding="utf-8")
        env["KUBECONFIG"] = str(kubeconfig)
        env["KUBE_CONTEXT"] = cluster

        subprocess.run(
            [
                "az", "aks", "get-credentials", "--only-show-errors",
                "--resource-group", env["AKS_RESOURCE_GROUP"], "--name", cluster,
                "--file", str(kubeconfig), "--context", cluster,
            ],
            env=env,
            check=True,
        )
        subprocess.run(
            [
                "ansible-playbook", "install-fluxcd-operator.yml",
                "--vault-password-file", str(password_file),
                "--extra-vars", "@vault/aks.yml", "--extra-vars", "@vault/aks-vars.yml",
            ],
            env=env,
            check=True,
        )

        kubectl = ["kubectl", "-n", "traefik"]
        subprocess.run(
            [*kubectl, "wait", "--for=create", "service/traefik", "--timeout=5m"],
            env=env,
            check=True,
        )
        subprocess.run(
            [
                *kubectl, "wait", "--for=jsonpath={.status.loadBalancer.ingress[*].ip}",
                "service/traefik", "--timeout=5m",
            ],
            env=env,
            check=True,
        )
        ingress = subprocess.check_output(
            [*kubectl, "get", "service/traefik", "-o", "jsonpath={.status.loadBalancer.ingress[0].ip}"],
            env=env,
            text=True,
        ).strip()
        address = ipaddress.IPv4Address(ingress)
        artifact.write_text(
            json.dumps({"traefik_public_ip": str(address)}) + "\n",
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
