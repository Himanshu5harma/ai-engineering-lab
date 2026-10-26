Work with ranks rather than the original retrieval scores.
---
Use a separate seen set for each ranking; enumerate before deduplicating.
---
Accumulate into a document-to-score mapping, then sort by (-score, document_id).
