import math


def top_k_similar(query: list[float], candidates: list[dict], k: int) -> list[dict]:
    def unit(vector):
        if not isinstance(vector, list) or len(vector) != len(query):
            raise ValueError("Mismatched vector dimensions")
        for value in vector:
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError("Vector components must be numbers")
            try:
                finite = math.isfinite(value)
            except OverflowError:
                raise ValueError("Components must fit finite floats") from None
            if not finite:
                raise ValueError("Nonfinite component")
        scale = max(abs(value) for value in vector)
        if scale == 0:
            return [0.0] * len(vector)
        scaled = [value / scale for value in vector]
        norm = math.sqrt(math.fsum(value * value for value in scaled))
        return [value / norm for value in scaled]

    if not isinstance(query, list) or not 1 <= len(query) <= 2048:
        raise ValueError("Query must contain 1–2048 components")
    if type(k) is not int or not 0 <= k <= 1000:
        raise ValueError("k must be an integer in 0–1000")
    if (
        not isinstance(candidates, list)
        or len(candidates) > 1000
        or len(candidates) * len(query) > 100000
    ):
        raise ValueError("Candidate work budget exceeded")
    query_unit = unit(query)
    seen = set()
    scored = []
    for item in candidates:
        if (
            not isinstance(item, dict)
            or not isinstance(item.get("id"), str)
            or not item["id"]
            or item["id"] in seen
        ):
            raise ValueError("Candidate IDs must be nonempty and unique")
        seen.add(item["id"])
        vector = unit(item.get("vector"))
        score = math.fsum(a * b for a, b in zip(query_unit, vector, strict=True))
        scored.append({"id": item["id"], "score": max(-1.0, min(1.0, score))})
    return sorted(scored, key=lambda item: (-item["score"], item["id"]))[:k]
