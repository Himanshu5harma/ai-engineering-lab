def filter_evidence(
    chunks: list[dict],
    tenant_id: str,
    product: str,
    version: str,
    allowed_roles: set[str],
    as_of: str,
) -> list[dict]:
    raise NotImplementedError("Fail closed on unauthorized, stale, or malformed evidence")
