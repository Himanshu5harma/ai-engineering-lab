# Why it works
A heading stack supplies provenance without flattening away hierarchy. Paragraph packing preserves source order and only splits oversized text. Isolating tables prevents context assembled from half a row and unrelated prose.

Time: O(B+T), where B is blocks and T is token references. Output storage: O(B+T). Heading depth is bounded by six. A structure-aware parser is a separate upstream responsibility; this function operates on its declared block format.

Alternatives: overlapping paragraph windows improve boundary recall but increase duplication; rendering whole tables preserves layout at the cost of larger contexts. Heading metadata must be included in embedding text by a later stage if desired.

Senior follow-ups: compare retrieval recall for table-heavy documents; preserve original cell/page coordinates; handle a single huge row without silent truncation.
