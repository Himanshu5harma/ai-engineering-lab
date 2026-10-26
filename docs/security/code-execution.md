# Local execution security model

This tool is for a trusted local single user. Do not expose it as an internet service. The local Docker daemon and worker are trusted and have significant host authority. Submitted Python runs only in ephemeral Linux containers, never inside FastAPI or an unsandboxed host subprocess. There is no host-runner fallback.

## Enforced configuration

- Non-root UID/GID 65534; image files readable but not writable.
- No network (`network_mode=none`, network disabled).
- Read-only root filesystem and no host mounts or Docker socket.
- One CPU, 128 MiB RAM, no additional swap, 32 PIDs, 64 file descriptors.
- All Linux capabilities dropped; no new privileges; Docker's default seccomp profile required.
- `/tmp` is an 8 MiB tmpfs with `noexec,nosuid,nodev`; individual file size limited to 1 MiB.
- Default eight-second execution budget; configurable 1–20 seconds. Container creation/API calls also have a short client timeout.
- Bounded bridge output (4096 characters per case) and bounded Docker log rotation (64 KiB, one file, bounded nonblocking buffer). Malformed/oversized output never earns credit.
- One active worker, maximum eight queued/running jobs by default. API body limit 80,000 bytes, code limit 32,768 UTF-8 bytes.
- Containers are removed in a `finally` block, including timeouts and infrastructure failures.

The worker checks Linux CPU, memory, PID and seccomp support and image presence before advertising readiness. No current heartbeat means execution is unavailable. The API returns a structured 503 rather than simulating results.

## Trust and limitations

The Python bridge is convenience plumbing, not a security boundary. Code shares its interpreter and can inspect/modify process state or write directly to stdout. Expected answers and pass/fail decisions stay outside that interpreter; invalid protocol output fails. Hidden inputs are visible inside the sandbox at execution time. This is not a tamper-resistant exam system, and challenges must not put secrets in fixtures.

Container isolation shares the Linux kernel. Public hostile-code hosting needs stronger isolation (such as microVMs), a dedicated execution host, daemon authorization, hardened and patched images, audited egress and storage boundaries, abuse controls, and independent review. Docker Desktop supplies a Linux VM here; rootless Docker is preferred on supported Linux hosts. The worker refuses missing controls rather than removing them to make a job run.

A forcibly killed worker or daemon can leave orphaned containers. Use the recovery command in development docs after stopping workers; do not indiscriminately delete unrelated containers. Interrupted jobs are eventually marked as infrastructure errors. The database is local and unencrypted; anyone with local database/repository access can read source and private fixtures. No authentication is supplied for this local-only release.

CORS and write-origin checks are restricted to configured loopback URLs, hostnames are checked against rebinding, and Compose binds published ports to loopback. They do not substitute for authentication on a networked deployment. No external provider receives code. Credentials in `.env.example` are documented local database defaults, not production secrets.

## Verification

`make integration` checks actual reference/starter execution, infinite loops, ordinary/raw excessive output, memory exhaustion, malformed code, runtime exceptions, UID, network denial, root filesystem denial, cgroup CPU/memory/PID settings, and container cleanup. Resource probes inspect kernel state; they are bounded and intentionally executed only in restricted containers. This test suite is regression evidence, not an independent sandbox security audit.

Primary references: [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/), [Docker security](https://docs.docker.com/engine/security/), [FastAPI container deployment](https://fastapi.tiangolo.com/deployment/docker/).
