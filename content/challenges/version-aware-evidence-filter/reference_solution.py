import re
from datetime import date


def filter_evidence(
    chunks: list[dict],
    tenant_id: str,
    product: str,
    version: str,
    allowed_roles: set[str],
    as_of: str,
) -> list[dict]:
    def numeric_version(value):
        if not isinstance(value, str) or not re.fullmatch(
            r"[0-9]{1,6}(?:\.[0-9]{1,6}){0,5}", value
        ):
            raise ValueError("Expected one to six numeric version components")
        parts = tuple(int(part) for part in value.split("."))
        return parts + (0,) * (6 - len(parts))

    def day(value):
        if not isinstance(value, str) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", value):
            raise ValueError("Expected YYYY-MM-DD")
        return date.fromisoformat(value)

    if not isinstance(chunks, list) or len(chunks) > 10000:
        raise ValueError("At most 10000 evidence candidates")
    if (
        not isinstance(tenant_id, str)
        or not tenant_id
        or not isinstance(product, str)
        or not product
    ):
        raise ValueError("Tenant and product are required")
    if not isinstance(allowed_roles, set) or any(
        not isinstance(role, str) or not role for role in allowed_roles
    ):
        raise ValueError("allowed_roles must be a set of nonempty strings")
    current, today = numeric_version(version), day(as_of)
    result = []
    for chunk in chunks:
        try:
            if (
                not isinstance(chunk, dict)
                or chunk.get("tenant_id") != tenant_id
                or chunk.get("product") != product
            ):
                continue
            if not isinstance(chunk.get("id"), str) or not chunk["id"]:
                continue
            roles = chunk["roles"]
            if (
                not isinstance(roles, list)
                or not roles
                or any(not isinstance(role, str) or not role for role in roles)
                or not allowed_roles.intersection(roles)
            ):
                continue
            lower = numeric_version(chunk["min_version"])
            upper = (
                numeric_version(chunk["max_version"]) if chunk["max_version"] is not None else None
            )
            valid_from = day(chunk["valid_from"])
            valid_until = day(chunk["valid_until"]) if chunk["valid_until"] is not None else None
            if upper is not None and upper <= lower:
                continue
            if valid_until is not None and valid_until <= valid_from:
                continue
            if current < lower or (upper is not None and current >= upper):
                continue
            if today < valid_from or (valid_until is not None and today >= valid_until):
                continue
            result.append(chunk)
        except (KeyError, ValueError, TypeError):
            continue
    return result
