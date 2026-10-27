def chunk_tokens(tokens: list[str], window_size: int, overlap: int) -> list[dict]:
    if type(window_size) is not int or not 1 <= window_size <= 2048:
        raise ValueError("window_size must be an integer from 1 to 2048")
    if type(overlap) is not int or not 0 <= overlap < window_size:
        raise ValueError("overlap must be smaller than the window")
    if (
        not isinstance(tokens, list)
        or len(tokens) > 10000
        or any(not isinstance(token, str) or not token for token in tokens)
    ):
        raise ValueError("Expected at most 10000 nonempty token strings")
    chunks = []
    start = 0
    while start < len(tokens):
        end = min(start + window_size, len(tokens))
        chunks.append({"start": start, "end": end, "tokens": tokens[start:end]})
        if end == len(tokens):
            break
        start = end - overlap
    return chunks
