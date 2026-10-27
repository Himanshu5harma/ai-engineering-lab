import re


def list_authorized_tools(
    tools: list[dict], tenant_id: str, roles: set[str], approved_tool_ids: set[str]
) -> list[dict]:
    if (
        not isinstance(tools, list)
        or len(tools) > 1000
        or not isinstance(tenant_id, str)
        or not tenant_id
        or tenant_id == "*"
    ):
        raise ValueError("Invalid tool registry or tenant context")
    for values in (roles, approved_tool_ids):
        if not isinstance(values, set) or any(
            not isinstance(value, str) or not value or value == "*" for value in values
        ):
            raise ValueError("Context permissions must be explicit string sets")
    names = set()
    for tool in tools:
        if isinstance(tool, dict) and isinstance(tool.get("name"), str) and tool["name"]:
            if tool["name"] in names:
                raise ValueError("Duplicate tool names are ambiguous")
            names.add(tool["name"])
    allowed = []
    for tool in tools:
        if (
            not isinstance(tool, dict)
            or not isinstance(tool.get("name"), str)
            or not re.fullmatch(r"[a-z][a-z0-9_]{0,63}", tool["name"])
        ):
            continue
        if (
            tool.get("enabled") is not True
            or type(tool.get("requires_approval")) is not bool
            or tool.get("risk") not in ("read", "write")
        ):
            continue
        tenants, required = tool.get("allowed_tenants"), tool.get("required_roles")
        if any(
            not isinstance(values, list)
            or not values
            or any(not isinstance(value, str) or not value or value == "*" for value in values)
            for values in (tenants, required)
        ):
            continue
        if tenant_id not in tenants or not set(required).issubset(roles):
            continue
        if tool["risk"] == "write" and not tool["requires_approval"]:
            continue
        if tool["requires_approval"] and tool["name"] not in approved_tool_ids:
            continue
        allowed.append({"name": tool["name"], "risk": tool["risk"]})
    return sorted(allowed, key=lambda tool: tool["name"])
