import math


def allocate_context(chunks: list[dict], context_limit: int, reserved_tokens: int) -> dict:
    if (
        type(context_limit) is not int
        or not 0 <= context_limit <= 1000000
        or type(reserved_tokens) is not int
        or not 0 <= reserved_tokens <= context_limit
    ):
        raise ValueError("Invalid context or reservation budget")
    if not isinstance(chunks, list) or len(chunks) > 1000:
        raise ValueError("At most 1000 evidence chunks")
    seen = set()
    for chunk in chunks:
        if (
            not isinstance(chunk, dict)
            or not isinstance(chunk.get("id"), str)
            or not chunk["id"]
            or chunk["id"] in seen
        ):
            raise ValueError("Chunk IDs must be nonempty and unique")
        seen.add(chunk["id"])
        if type(chunk.get("token_count")) is not int or not 1 <= chunk["token_count"] <= 1000000:
            raise ValueError("Token counts must be positive integers")
        score = chunk.get("score")
        if isinstance(score, bool) or not isinstance(score, (int, float)):
            raise ValueError("Scores must be finite numbers")
        try:
            finite = math.isfinite(score)
        except OverflowError:
            raise ValueError("Score outside float range") from None
        if not finite:
            raise ValueError("Score must be finite")
    capacity = context_limit - reserved_tokens
    selected, used = [], 0
    for chunk in sorted(chunks, key=lambda item: (-item["score"], item["id"])):
        if chunk["token_count"] <= capacity - used:
            selected.append(chunk["id"])
            used += chunk["token_count"]
    return {"selected_ids": selected, "used_tokens": used, "remaining_tokens": capacity - used}
