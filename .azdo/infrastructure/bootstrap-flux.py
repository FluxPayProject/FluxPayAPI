"""Bootstrap Flux on AKS and publish the Traefik IPv4 address to Azure Pipelines."""

import base64
import binascii
import ipaddress
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time


def kubectl_json(namespace, resource, name):
    result = subprocess.run(
        ["kubectl", "--request-timeout=10s", "-n", namespace, "get", resource, name, "-o", "json"],
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout) if result.returncode == 0 else {}


def wait_for_ingress():
    print("Waiting for the Traefik LoadBalancer and its public IPv4 address.", flush=True)
    deadline = time.monotonic() + 900
    while time.monotonic() < deadline:
        kustomization = kubectl_json("flux-system", "kustomization", "traefik")
        status = kustomization.get("status", {})
        generation = kustomization.get("metadata", {}).get("generation")
        ready = any(
            condition["type"] == "Ready" and condition["status"] == "True"
            for condition in status.get("conditions", [])
        )
        if ready and generation == status.get("observedGeneration"):
            service = kubectl_json("traefik", "service", "traefik")
            annotations = service.get("metadata", {}).get("annotations", {})
            if (
                service.get("spec", {}).get("type") == "LoadBalancer"
                and annotations.get("service.beta.kubernetes.io/azure-load-balancer-internal") != "true"
            ):
                ingress = service.get("status", {}).get("loadBalancer", {}).get("ingress", [])
                for endpoint in ingress:
                    try:
                        return str(ipaddress.IPv4Address(endpoint.get("ip")))
                    except ipaddress.AddressValueError:
                        continue
        time.sleep(10)

    print("Timed out waiting for Traefik and its public IPv4 address.", file=sys.stderr)
    subprocess.run(["kubectl", "--request-timeout=10s", "-n", "flux-system", "get", "gitrepositories,kustomizations"])
    subprocess.run(["kubectl", "--request-timeout=10s", "-n", "traefik", "get", "helmrelease,service", "-o", "wide"])
    raise SystemExit(1)


def main():
    try:
        bootstrap_vars = base64.b64decode(os.environ.pop("FLUX_BOOTSTRAP_VARS_BASE64", ""), validate=True)
    except (binascii.Error, ValueError):
        bootstrap_vars = b""
    if not bootstrap_vars.strip():
        raise SystemExit("Flux bootstrap variables are missing or invalid base64.")

    os.umask(0o077)
    with tempfile.TemporaryDirectory() as temp_dir:
        work_dir = Path(temp_dir)
        kubeconfig = work_dir / "kubeconfig"
        vars_file = work_dir / "bootstrap.yml"
        vars_file.write_bytes(bootstrap_vars)
        os.environ["KUBECONFIG"] = str(kubeconfig)

        subprocess.run(
            [
                "az", "aks", "get-credentials", "--admin",
                "--resource-group", os.environ["AKS_RESOURCE_GROUP"],
                "--name", os.environ["AKS_CLUSTER_NAME"],
                "--file", str(kubeconfig),
            ],
            check=True,
        )
        context = subprocess.check_output(["kubectl", "config", "current-context"], text=True).strip()

        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        subprocess.run(
            ["ansible-galaxy", "collection", "install", "-r", "requirements.galaxy.yml", "-p", ".ansible/collections"],
            check=True,
        )
        subprocess.run(
            [
                "ansible-playbook", "install-fluxcd-operator.yml",
                "--extra-vars", f"@{vars_file}",
                "--extra-vars", json.dumps({"fluxify_kubeconfig": str(kubeconfig), "fluxify_context": context}),
            ],
            check=True,
        )

        public_ip = wait_for_ingress()
        print(f"##vso[task.setvariable variable=publicIp;isOutput=true]{public_ip}")


if __name__ == "__main__":
    main()
