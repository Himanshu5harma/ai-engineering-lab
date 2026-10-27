def list_authorized_tools(tools, tenant_id, roles, approved_tool_ids):
    return sorted(
        [
            {"name": tool["name"], "risk": tool["risk"]}
            for tool in tools
            if tool.get("enabled")
            and (
                tool["name"] in approved_tool_ids
                or not tool.get("required_roles")
                or roles.intersection(tool["required_roles"])
            )
        ],
        key=lambda tool: tool["name"],
    )
