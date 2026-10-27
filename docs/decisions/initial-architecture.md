# Initial architectural decisions

1. **PostgreSQL as the queue.** A local single-user worker does not need Redis. Row locking makes the job durable in the same transaction as the submission. A session advisory lock enforces one production worker; `SKIP LOCKED` protects claims. Revisit a dedicated queue when multiple workers and routing become real needs.
2. **Worker on the trusted host.** A Docker socket has powerful host authority. Only the dedicated local worker needs it; the API has none. This avoids Docker-in-Docker and host bind mounts in submitted-code containers.
3. **External deterministic grading.** The sandbox reports values, not a pass flag. Expected results stay in the worker. Hidden tests are withheld from ordinary API responses. This improves integrity but is not hostile-code examination security.
4. **JSON function challenges.** Public/private fixtures declare kwargs and expected values or exception types. They are runnable by the common worker without installing pytest or arbitrary dependencies in the runtime. This format covers the two chosen retrieval challenges; multi-file labs need a separate trusted harness design.
5. **Immutable content hashes.** Any package edit produces a new identity. A worker mismatch fails explicitly. Content is version-controlled; progress is tied to the current hash. Release API and worker from the same checkout.
6. **Single-user local access.** No billing, authentication, cloud provisioning, or model provider. Loopback listeners, restricted hostnames and origins, JSON request validation, and body/queue limits fit the intended deployment. Public deployment requires an independent security design.
7. **Practical UI dependencies.** React Router and TanStack Query manage navigation and polling. Monaco is loaded on demand with locally bundled workers. Plain CSS keeps a small design system without another framework. React Flow belongs to the later system design phase.
8. **Honest evidence.** Public success never awards completion. Dashboard values come from stored executions. Mastery, revision scheduling, AI feedback, and later modules are deferred rather than represented by invented data.
9. **Testing layers.** Fast isolated tests use SQLite and a test-only predetermined runner. PostgreSQL tests prove real locking/persistence. Docker tests prove container execution and configured controls. Browser E2E uses all real services. Only the latter layers support end-to-end execution claims.

## Curriculum milestone additions

- A validated 88-entry manifest supplies stable curriculum IDs, exact first-release ordering and explicit ready/planned counts. It contains metadata for future exercises, not placeholder runnable problems.
- The original grading hash remains authoritative for submissions. Curriculum metadata and manual-review prompts are separate from that hash, preserving existing cosine/RRF evidence while adding the learning sequence.
- Native set fixtures use a declarative `$set` data marker; the sandbox bridge decodes it and snapshots sets deterministically. Learner output still must be JSON and is graded outside the container.
- Public/private pytest wrappers verify only trusted repository reference code on the host. All learner and deliberately buggy implementations run only through the Docker adapter.
- `ChallengeReview` stores manual engineering tasks and notes by grading version. A review cannot award automated coding credit. UI labels distinguish code verification from learner self-review and avoid claiming mastery.
- Browser acceptance can run against a temporary loopback database to keep automated reference-solution evidence out of personal progress.
