def allocate_context(chunks, context_limit, reserved_tokens):
    used = 0
    selected = []
    for chunk in sorted(chunks, key=lambda c: -c["score"]):
        if used + chunk["token_count"] <= context_limit:
            selected.append(chunk["id"])
            used += chunk["token_count"]
    return {"selected_ids": selected, "used_tokens": used, "remaining_tokens": context_limit - used}
