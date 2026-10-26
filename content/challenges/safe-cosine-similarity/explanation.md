# Why it works
Dividing a vector by a positive scale preserves its direction. Using the largest absolute component bounds the scaled components by one; at most 4096 squared components can be accumulated safely. Normalizing the scaled vectors avoids multiplying huge norms. `math.fsum` reduces cancellation error.

Time: O(d). Space: O(d) here; an iterator-based alternative can reduce auxiliary storage. A naive dot product divided by two raw norms can overflow on ordinary finite floats. A zero-vector fallback must not conceal invalid data in the other vector.

## Interview follow-ups
- When would dot product ranking differ from cosine ranking?
- What happens when your embedding model changes dimensions?
- Would you reject or quarantine malformed embeddings at ingestion?
