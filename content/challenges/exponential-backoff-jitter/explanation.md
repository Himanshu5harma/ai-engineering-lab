# Why it works
The raw schedule doubles until the ceiling. The jitter multiplier stays in [1-jitter,1], so it cannot exceed the already-capped delay. Injected samples make boundary and distribution-policy tests deterministic.

Time and output space: O(a) for a attempts; auxiliary state is O(1). A generator is suitable when the caller consumes schedules incrementally. Production retry loops must additionally respect request deadlines, Retry-After headers, cancellation and idempotency; this planner intentionally does none of the I/O.

Alternatives: equal/decorrelated jitter, provider retry hints, or queue-level scheduling. Evaluate synchronization and tail latency rather than adding arbitrary sleep.

Senior follow-ups: classify retryable errors, budget retries across service layers, and prevent duplicate side effects.
