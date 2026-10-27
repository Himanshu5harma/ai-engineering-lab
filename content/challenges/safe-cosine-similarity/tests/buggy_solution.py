"""Deliberately unsafe raw norm computation for negative verification."""

import math


def cosine_similarity(a, b):
    if not a or len(a) != len(b):
        raise ValueError("Bad dimensions")
    denominator = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return sum(x * y for x, y in zip(a, b, strict=True)) / denominator if denominator else 0.0
