# Why it works
The same deterministic normalization makes comparisons reproducible across document line wrapping and Unicode composition. Resolving each reference through a unique source map rejects fabricated IDs; checking exact normalized spans rejects invented quotes.

Time: O(S + C×L) in a conservative substring-search bound for source text size S and quote checks C over source length L. Space: O(S+C). Source-offset-based citations can avoid repeated substring searches but require immutable source versions and offset mappings.

Alternatives: byte offsets, page/paragraph anchors, or signed provenance references. Fuzzy quote matching risks accepting unsupported text and needs a separately evaluated policy.

Senior follow-ups: entailment and contradiction review, citation coverage, source authority/versioning, access-controlled references, and Unicode normalization trade-offs.
