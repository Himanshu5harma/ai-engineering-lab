# Prioritized curriculum roadmap

## Delivered: first twelve Coding Arena challenges

The active first release follows this exact learning order:

| Order | ID | Verified challenge |
|---|---|---|
| 1 | R01 | Safe cosine similarity |
| 2 | R02 | Deterministic top-K vector search |
| 3 | R04 | Token-window chunking |
| 4 | R05 | Heading- and table-aware chunking |
| 5 | R08 | Tenant-, permission- and version-aware evidence filtering |
| 6 | R09 | Reciprocal Rank Fusion |
| 7 | G03 | Context-window budget allocation |
| 8 | E01 | Precision@K and Recall@K |
| 9 | E02 | Mean reciprocal rank and graded nDCG |
| 10 | G06 | Citation source/quote verification |
| 11 | P03 | Deterministic exponential backoff and jitter |
| 12 | A02 | Permission-aware tool registry |

Each package includes a clear contract, starter, reference, public/private fixtures and pytest wrappers, deliberate buggy implementation, progressive hints, complexity/alternative discussion, security/performance constraints, production failure variant and senior follow-ups. The platform stores engineering self-review separately from deterministic code-test credit. A passing solution does not certify mastery.

## Full curriculum: 88 planned entries

`content/curriculum.json` is the validated source of truth: 64 coding entries across seven tracks, 10 system design entries, 6 practical labs and 8 production debugging scenarios. Twelve coding and three design exercises are ready. The other 73 are roadmap metadata. The Curriculum screen exposes this distinction.

Suggested planning baseline: coding 6h, system design 3h, practical labs 8h, debugging/revision 3h per week. These are planning allocations, not measured study time; persistent personal study-goal settings remain future work.

## Delivered: System Design Studio

The React Flow canvas supports configurable components, notes, positions and labeled connections, with PostgreSQL drafts and SVG/Markdown/JSON export. D01 covers enterprise RAG for one million documents, D02 durable ingestion at 100000 updates/day, and D03 version-aware technical support. Each has requirements, workload assumptions, constraints, five targeted deliverable prompts, a six-criterion review rubric and senior follow-ups.

Review readiness requires a component diagram with at least two connected components plus request/data flow, capacity assumptions, failure analysis and ADR text. These are structural checks, not architecture quality verification. Rubric ratings are explicit learner self-assessment. Saved work is content-versioned, uses optimistic revision checks and cannot grant coding credit. Unsaved browser recovery and exports help preserve work during navigation or a save conflict.

## Next: production RAG lab and Debugging Arena

Build L03 as a real multi-file React/FastAPI/PostgreSQL/pgvector project using public/synthetic data. Include hybrid retrieval, reranking, citations, permission filters and measured quality. Start debugging with stale evidence, cross-tenant leakage and duplicated tool effects; ship logs, broken code, deterministic failing checks and fix verification together.

## Expand incrementally

Implement each remaining coding challenge with actual verification before marking it ready. Add the other design exercises and labs individually. Support learning/interview modes, explicit solution reveal, configurable study goals, spaced revision and benchmark history when their complete workflows are implemented.

## Later: optional mentor, security hardening and portfolio exports

Any external model is opt-in with server-side credentials, usage controls and evidence labels. Deterministic tests remain authoritative. Public hostile-code execution needs stronger isolation, an independent threat model and review before exposure. No cloud deployment, purchase or repository push is part of this milestone.

## Readiness and user handling note — 2026-11-01

The current application is a tested local, single-user MVP. Focused routers, typed contracts, reliable drafts, shared UI controls and sandbox tests are foundations; they do not establish production readiness.

### Current user model

- There is no user/account model, login, authenticated session or server-side user identity. The application assumes one trusted local learner.
- PostgreSQL submissions, results, design drafts and engineering reviews belong to one shared workspace. There are no user ownership columns or ownership checks. Progress aggregates stored submissions for current challenge versions, regardless of who or what created them.
- Design workspaces and engineering reviews are keyed by exercise content version, not by learner. Different people reaching the same backend would share these records.
- Code drafts, engineering notes, bookmarks and appearance preferences are browser-local. Their storage is scoped to the browser profile and site origin, not an authenticated account. Per-document recovery writer IDs prevent competing backups from being deleted; they are not user identities or authorization boundaries.
- This release does not provide isolated accounts for different learners and must not be presented as a multi-user service.

### Recorded data-integrity issue

Earlier automated browser verification wrote reference solutions and test activity into the learning database. These records are counted as solved challenges and submissions even though the learner did not complete them. Later verification used isolated databases, but the older records remained. This is a testing-isolation failure, not evidence of learner progress. Backed-up, explicitly authorized cleanup remains pending; this note does not authorize deleting records.

Enforce test-database isolation with fail-closed safeguards before further activity-writing browser tests. Keep verification evidence separate from learner history rather than relying on operators to select the correct environment.

### Gates before supporting additional users

- Add authenticated accounts and derive the current user on the server. Do not trust a client-supplied user ID as authorization.
- Add ownership to submissions, design drafts and reviews; scope progress, lists, individual reads, results, restores, exports and previous-version access to that owner. Results inherit their submission's ownership. Keep common curriculum/content shared.
- Make draft/review uniqueness include both owner and content version while retaining optimistic revision protection. Namespace browser drafts, recovery copies, notes and bookmarks by account, and handle account switching without leaking or silently discarding work.
- Migrate existing work through an explicit legacy-owner assignment, keeping backups and content/grading identities intact. Add cross-user access regression coverage. Retain SQLAlchemy and Alembic.

Hosted operation also requires secure access/HTTPS, production secrets and configuration, supervised API/worker processes, monitoring, automated backups with tested restoration, and a committed release verified by hosted CI. Public untrusted code execution requires a reviewed isolation architecture and dedicated execution infrastructure. Authentication alone does not resolve that execution boundary.
