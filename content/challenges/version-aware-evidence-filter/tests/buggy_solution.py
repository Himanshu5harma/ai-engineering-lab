def filter_evidence(chunks, tenant_id, product, version, allowed_roles, as_of):
    return [
        c
        for c in chunks
        if isinstance(c, dict)
        and c.get("product") == product
        and c.get("min_version", "") <= version
        and (not c.get("roles") or allowed_roles.intersection(c["roles"]))
    ]
