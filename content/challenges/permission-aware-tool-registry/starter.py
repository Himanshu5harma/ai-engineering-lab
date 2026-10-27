def list_authorized_tools(
    tools: list[dict], tenant_id: str, roles: set[str], approved_tool_ids: set[str]
) -> list[dict]:
    raise NotImplementedError("Apply explicit tenant, role, and approval policy")
