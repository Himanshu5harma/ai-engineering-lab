def precision_recall_at_k(retrieved, relevant, k):
    hits = sum(value in relevant for value in retrieved[:k])
    return {
        "precision": hits / len(retrieved[:k]) if retrieved[:k] else 0.0,
        "recall": hits / len(relevant) if relevant else 0.0,
    }
