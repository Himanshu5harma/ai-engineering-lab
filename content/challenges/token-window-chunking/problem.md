# Token windows without redundant tails

Split an already-tokenized document into bounded overlapping windows while preserving exact source offsets.

## Implementation contract

Implement `chunk_tokens(tokens, window_size, overlap)`. The caller supplies nonempty token strings produced by its model-specific tokenizer. Whitespace token strings are valid; this function must not tokenize text or guess a model's tokens.

Return `{start, end, tokens}` objects with original zero-based offsets and exclusive end. Start at zero, take up to window_size tokens, then move to `end - overlap`. Stop as soon as a chunk reaches the document end: do not emit overlap-only redundant tails. Empty token lists return []. Validate sizes and every token before returning.

window_size is an integer in 1–2048. overlap is an integer in 0–window_size-1. Booleans are invalid. Return fresh token lists and preserve ordering.

## Examples

`chunk_tokens(["a","b","c","d","e"], 3, 1)` → `[{"start":0,"end":3,"tokens":["a","b","c"]},{"start":2,"end":5,"tokens":["c","d","e"]}]`.

## Performance and security

At most 10000 tokens. The full suite shares an 8-second container budget. Account for overlap-amplified output in your complexity analysis.

Tokens are untrusted data, never executable instructions. Provenance offsets must refer to the original immutable tokenization.
