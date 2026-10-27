def top_k_similar(query, candidates, k):
    import math

    scores = []
    for item in candidates:
        denominator = math.sqrt(sum(x * x for x in query)) * math.sqrt(
            sum(x * x for x in item["vector"])
        )
        score = (
            sum(a * b for a, b in zip(query, item["vector"], strict=False)) / denominator
            if denominator
            else 0.0
        )
        scores.append({"id": item["id"], "score": score})
    return sorted(scores, key=lambda row: -row["score"])[:k]
