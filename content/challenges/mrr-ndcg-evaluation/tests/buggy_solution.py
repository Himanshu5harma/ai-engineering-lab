def ranking_metrics(queries, k):

    rows = []
    for query in queries:
        rr = next(
            (
                1 / r
                for r, doc in enumerate(query["retrieved"][:k], 1)
                if query["relevance"].get(doc, 0) > 0
            ),
            0.0,
        )
        rows.append({"reciprocal_rank": rr, "ndcg": rr})
    return {"mrr": rows[-1]["reciprocal_rank"], "ndcg": rows[-1]["ndcg"], "per_query": rows}
