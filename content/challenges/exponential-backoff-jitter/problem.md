# Plan bounded retries with deterministic jitter

Build a reproducible exponential-backoff schedule without sleeping, contacting a provider, or using global randomness.

## Implementation contract

Implement `backoff_delays(attempts, base_delay, max_delay, jitter, random_values)`. Return one delay per retry attempt, with attempt zero using base_delay before capping.

The unjittered delay for attempt i is `min(max_delay, base_delay * 2**i)`. The final delay is `raw * (1-jitter+jitter*u)`, where u is the corresponding provided random value in [0,1]. jitter=0 gives no jitter; jitter=1 gives full jitter from zero to the capped delay. The cap applies before jitter, and no final delay may exceed it. max_delay may be smaller than base_delay.

attempts is an integer in 0–30 excluding bool. base_delay/max_delay are positive finite numbers. jitter is a finite number in [0,1]. Supply exactly one finite random value per attempt. Validate all configuration even when attempts=0. No sleeps, network calls, or random-module calls are allowed by this pure planning contract.

## Examples

`backoff_delays(4,1,5,0,[0.5]*4)` → `[1,2,4,5]`. Full jitter with values `[0,0.5,1,0.2]` gives `[0,1,4,1]`.

## Performance and security

0–30 retries, finite numeric parameters, exactly one injected sample per retry. The full suite shares an 8-second budget.

Retries must not repeat sensitive side effects without idempotency and authorization checks. A correct delay schedule alone does not make an unsafe operation retryable.
