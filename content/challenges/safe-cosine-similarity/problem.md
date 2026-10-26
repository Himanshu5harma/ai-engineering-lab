# Cosine similarity, without surprises

A retrieval service uses cosine similarity to rank document embeddings. Implement `cosine_similarity(a, b)` with a stable numerical contract.

## Contract
Return the dot product of the unit vectors. Scale each input before computing its norm so finite inputs near `1e308` do not overflow and values near `1e-300` do not vanish.

Validate both vectors before handling zero norms. Raise `ValueError` for empty lists, different dimensions, more than 4096 dimensions, booleans, non-numeric values, NaN, infinity, or integers too large to represent as finite Python floats. Do not mutate either input. If either vector is all zeros, return `0.0`.

Use only the Python standard library. Clamp rounding drift to `[-1, 1]`.

## Examples
`cosine_similarity([1, 0], [0, 1])` → `0.0`

`cosine_similarity([1, 2], [2, 4])` → `1.0`

`cosine_similarity([0, 0], [7, 8])` → `0.0`

`cosine_similarity([], [])` → raises `ValueError`
