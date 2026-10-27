# Filter evidence before it can leak

Filter candidate evidence by tenant, product, numeric version range, validity dates, and explicit role access.

## Implementation contract

Implement `filter_evidence(chunks, tenant_id, product, version, allowed_roles, as_of)`. Return accepted original chunk dictionaries in their original order, including any original extra fields.

A candidate requires `id`, `tenant_id`, `product`, `min_version`, `max_version`, `roles`, `valid_from`, and `valid_until`. Tenant/product must exactly match. `roles` must be a nonempty list of nonempty strings with at least one member in the request's role set. Empty/missing roles never mean public access. No administrator bypass exists.

Versions have one to six numeric dot-separated components, each 1–6 ASCII digits. Compare components numerically, padding trailing zeros: 5.10 > 5.2 and 5.2 == 5.2.0. The version range is min_version inclusive, max_version exclusive. An explicit null max_version is unbounded; a missing bound is malformed. Reject pre-release labels rather than guessing their semantics.

Validity dates are exact YYYY-MM-DD calendar dates, valid_from inclusive and valid_until exclusive. Explicit null valid_until is unbounded. Invalid/empty ranges and malformed candidates are silently rejected (fail closed). Invalid request context raises ValueError. An empty role set is valid and accepts nothing.

`allowed_roles` is a Python set. Public fixtures encode it as `{"$set":["support"]}`; the runner converts this data marker into a set before calling your function.

## Examples

An acme/router document valid for `[5.2,6.0)` and `[2026-01-01,2027-01-01)` with roles `["support"]` is accepted for version 5.10 and role set `{"support"}` on 2026-10-26.

## Performance and security

At most 10000 chunks. Version components have at most six digits and six segments. The suite shares an 8-second execution budget.

Authorization must run before retrieved bodies reach a model, log, reranker, or cross-tenant cache. Post-filtering alone is not a complete retrieval security architecture.
