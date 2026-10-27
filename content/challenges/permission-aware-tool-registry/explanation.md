# Why it works
Eligibility is the conjunction of explicit registration, enabled state, tenant membership, required-role inclusion and approval requirements. Denying incomplete policy removes dangerous permissive defaults. Duplicate names fail before selection so dispatch cannot resolve a different implementation after authorization.

Time: O(n log n + policy entries), with set-based role checks; auxiliary space O(n + policy entries). Policy indexing can accelerate large registries but needs safe invalidation and versioning.

Production execution must re-check authoritative policy at dispatch, authenticate approval provenance, bind approvals to arguments/request IDs, and enforce idempotency. Hiding tools in a UI is not an execution security boundary.

Senior follow-ups: TOCTOU policy changes, least-privilege tool credentials, approval expiry, replay defense, and bounded agent workflows.
