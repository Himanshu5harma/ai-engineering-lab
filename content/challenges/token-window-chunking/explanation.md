# Why it works
The positive stride guarantees termination. Ending immediately at the final source offset prevents redundant overlap-only output. Keeping original offsets lets downstream citations map chunks back to their source.

Time and output space are O(nw/(w-o)) in the overlap-heavy case, because overlapping tokens are copied intentionally. With fixed modest overlap they are O(n). Generator implementations can reduce peak auxiliary storage but cannot eliminate the output size.

Follow-ups: select tokenizer/version metadata at ingestion; measure overlap's effect on recall and storage; define stable chunk IDs during reindexing.
