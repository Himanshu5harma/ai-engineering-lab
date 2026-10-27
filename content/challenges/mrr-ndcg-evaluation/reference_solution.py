import math


def ranking_metrics(queries: list[dict], k: int) -> dict:
    if type(k) is not int or not 1 <= k <= 1000:
        raise ValueError("k must be in 1–1000")
    if not isinstance(queries, list) or not 1 <= len(queries) <= 100:
        raise ValueError("An evaluation needs 1–100 queries")
    results = []
    for query in queries:
        if not isinstance(query, dict):
            raise ValueError("Malformed query evaluation")
        retrieved, relevance = query.get("retrieved"), query.get("relevance")
        if (
            not isinstance(retrieved, list)
            or len(retrieved) > 1000
            or any(not isinstance(doc, str) or not doc for doc in retrieved)
        ):
            raise ValueError("Invalid ranked document IDs")
        if not isinstance(relevance, dict) or len(relevance) > 1000:
            raise ValueError("Invalid relevance labels")
        for doc, grade in relevance.items():
            if not isinstance(doc, str) or not doc or type(grade) is not int or not 0 <= grade <= 5:
                raise ValueError("Grades must be integers from 0 to 5")
        seen, terms = set(), []
        reciprocal_rank = 0.0
        for rank, doc in enumerate(retrieved[:k], start=1):
            grade = relevance.get(doc, 0) if doc not in seen else 0
            seen.add(doc)
            if grade > 0 and reciprocal_rank == 0:
                reciprocal_rank = 1.0 / rank
            terms.append((2**grade - 1) / math.log2(rank + 1))
        ideal = math.fsum(
            (2**grade - 1) / math.log2(rank + 1)
            for rank, grade in enumerate(sorted(relevance.values(), reverse=True)[:k], start=1)
        )
        results.append(
            {"reciprocal_rank": reciprocal_rank, "ndcg": math.fsum(terms) / ideal if ideal else 0.0}
        )
    return {
        "mrr": math.fsum(row["reciprocal_rank"] for row in results) / len(results),
        "ndcg": math.fsum(row["ndcg"] for row in results) / len(results),
        "per_query": results,
    }
