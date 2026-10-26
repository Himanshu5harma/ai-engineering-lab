def reciprocal_rank_fusion(
    lexical: list[str], semantic: list[str], k: int = 60
) -> list[dict[str, str | float]]:
    if type(k) is not int or not 1 <= k <= 1000:
        raise ValueError("k must be an integer from 1 to 1000")
    scores: dict[str, float] = {}
    for ranking in (lexical, semantic):
        if len(ranking) > 1000:
            raise ValueError("At most 1000 entries per ranking")
        seen: set[str] = set()
        for rank, doc_id in enumerate(ranking, start=1):
            if not isinstance(doc_id, str) or not doc_id:
                raise ValueError("Document IDs must be nonempty strings")
            if doc_id not in seen:
                scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
                seen.add(doc_id)
    return [
        {"id": doc_id, "score": score}
        for doc_id, score in sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    ]
