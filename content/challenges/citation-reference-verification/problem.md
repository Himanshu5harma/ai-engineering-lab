# Verify citation references against source text

Reject fabricated source references and quotes while keeping mechanical verification separate from semantic faithfulness.

## Implementation contract

Implement `verify_citations(claims, sources)`. A source has a unique nonempty string `id` and string `text`. A claim has nonblank `text` and an optional `citations` list. Each citation has `source_id` and `quote` strings.

Normalize source text and quotes with Unicode NFC, then collapse each run of whitespace to one space. Comparisons are case-sensitive. A reference is valid only when its source exists, its normalized quote is nonempty, and that quote is a contiguous substring of the normalized source.

Return `{all_references_valid:bool, claims:[{index:int, references_valid:bool, errors:[str]}]}`. Missing/empty citation lists produce `missing_citation`. Report at most one error per citation, in this order: malformed fields → `invalid_citation`; unknown source → `unknown_source`; empty quote → `empty_quote`; absent quote → `quote_not_found`. Prefix citation errors with `citation N: ` using a zero-based index. Preserve claim/citation order. No claims means false overall validity and an empty claims list.

Malformed top-level collections, sources, claims or citation-list types raise ValueError. A malformed individual citation is a diagnostic, not a request failure. Duplicate source IDs raise ValueError; never choose an ambiguous source silently.

This checks reference integrity, not whether a quote entails a claim. A claim can still be misleading despite mechanically valid references.

## Examples

Source s1 contains `"Retries must be idempotent."`; a citation `{source_id:"s1", quote:"must be idempotent"}` has a valid reference. A quote `"retries are always safe"` produces `citation 0: quote_not_found`.

## Performance and security

At most 100 claims/sources, 100000 source characters total, 2000 claim/quote characters and 20 citations per claim. Suite budget: 8 seconds.

Only already-authorized sources may be checked. Never treat a mechanically valid reference as proof of claim faithfulness or source authority.
