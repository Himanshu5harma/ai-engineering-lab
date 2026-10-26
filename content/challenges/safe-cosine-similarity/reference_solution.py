import math


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or len(a) != len(b) or len(a) > 4096:
        raise ValueError("Vectors must have equal, nonempty dimensions up to 4096")
    for vector in (a, b):
        for value in vector:
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError("Every component must be a finite number")
            try:
                finite = math.isfinite(value)
            except OverflowError:
                raise ValueError("Components must fit a finite Python float") from None
            if not finite:
                raise ValueError("Every component must be a finite number")
    scale_a = max(abs(x) for x in a)
    scale_b = max(abs(x) for x in b)
    if scale_a == 0 or scale_b == 0:
        return 0.0
    scaled_a = [x / scale_a for x in a]
    scaled_b = [x / scale_b for x in b]
    norm_a = math.sqrt(math.fsum(x * x for x in scaled_a))
    norm_b = math.sqrt(math.fsum(x * x for x in scaled_b))
    score = math.fsum((x / norm_a) * (y / norm_b) for x, y in zip(scaled_a, scaled_b, strict=True))
    return max(-1.0, min(1.0, score))
