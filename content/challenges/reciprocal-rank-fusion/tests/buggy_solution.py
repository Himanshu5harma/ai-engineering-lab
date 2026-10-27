"""Deliberately counts duplicate per-list votes."""


def reciprocal_rank_fusion(lexical, semantic, k=60):
    scores = {}
    for ranking in (lexical, semantic):
        for rank, doc in enumerate(ranking, 1):
            scores[doc] = scores.get(doc, 0.0) + 1 / (k + rank)
    return [
        {"id": doc, "score": score}
        for doc, score in sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    ]
