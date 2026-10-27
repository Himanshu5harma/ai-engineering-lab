# Expose only tools the caller may use

Select eligible tools from explicit registry policy without allowing approval flags or missing metadata to grant authority.

## Implementation contract

Implement `list_authorized_tools(tools, tenant_id, roles, approved_tool_ids)`. Return sorted `{name, risk}` descriptors for eligible tools. This is a pure policy-selection function; it does not execute tools or verify that an approval came from a human.

Each tool needs a valid name (`[a-z][a-z0-9_]{0,63}`), nonempty `allowed_tenants` and `required_roles` lists, risk `read` or `write`, a boolean `requires_approval`, and enabled=true. Tenant membership must be exact; all required roles must be held. Missing or malformed policy denies the tool. No role is universally privileged and wildcard `*` values are unsupported.

All write tools must have requires_approval=true. Any tool requiring approval must be named in approved_tool_ids, in addition to satisfying tenant and role checks. A write tool configured requires_approval=false is unsafe and must be denied, even if its ID was approved.

Duplicate nonempty tool names raise ValueError before authorization, including disabled tools. Other malformed tool records are skipped. Invalid request context raises ValueError. Empty role/approval sets are valid. roles and approved_tool_ids are actual Python sets; fixtures use `{"$set":[...]}` markers. Ignore extra tool metadata and preserve inputs.

## Examples

A read_logs tool assigned to tenant acme and role support is eligible for that context. A restart_service write tool also needs an explicit approval ID and a true requires_approval flag.

## Performance and security

At most 1000 tools; tool names contain at most 64 characters. Full-suite execution is limited to 8 seconds.

The registry and approval provenance must come from trusted server policy. This function does not perform side effects; actual dispatch must repeat authorization and validate arguments.
