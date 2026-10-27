# Why it works
Every accepted chunk satisfies all independent access, compatibility and validity predicates. Metadata parsing is inside a fail-closed candidate boundary; request errors remain explicit. Numeric tuples avoid lexicographic 5.10/5.2 mistakes and float-version ambiguity.

Time: O(n×(r+v)) for n candidates, r roles and bounded version components v≤6. Auxiliary storage: O(n) selected references. Push tenant/permission/version predicates into database/vector retrieval for large collections. Python post-filtering is defense in depth, not permission to retrieve unauthorized bodies into logs or a prompt first.

Alternatives: full semantic-version libraries support prereleases but need an explicit policy; access-control joins enforce authoritative permissions before vector search. Versioned authorization caches need invalidation.

Senior follow-ups: prove zero unauthorized retrievals, filter before reranking/context assembly, and audit query plans over a million chunks.
