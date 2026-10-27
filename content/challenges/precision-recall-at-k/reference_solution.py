def precision_recall_at_k(retrieved: list[str], relevant: list[str], k: int) -> dict:
    if type(k) is not int or not 1 <= k <= 1000:
        raise ValueError("k must be an integer in 1–1000")
    for values in (retrieved, relevant):
        if (
            not isinstance(values, list)
            or len(values) > 10000
            or any(not isinstance(value, str) or not value for value in values)
        ):
            raise ValueError("Expected at most 10000 nonempty document IDs")
    truth = set(relevant)
    hits = len(set(retrieved[:k]).intersection(truth))
    return {"precision": hits / k, "recall": hits / len(truth) if truth else 0.0}
