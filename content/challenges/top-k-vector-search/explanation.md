# Why it works
Scaling by the largest component preserves direction and avoids norm overflow. Ranking unit-vector dot products is cosine search. A secondary ID key makes equal scores independent of ingestion order.

Reference complexity: O(nd + n log n) time and O(nd) worst-case input plus O(n+d) auxiliary storage. A streaming size-K heap reduces ranking overhead to O(n log k), while approximate indexes trade recall for latency at larger scale.

Senior follow-ups: measure ANN recall against this exact baseline; handle embedding-model migrations; explain why authorization must precede candidate exposure.
