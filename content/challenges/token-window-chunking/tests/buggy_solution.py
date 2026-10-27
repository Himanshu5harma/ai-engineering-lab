def chunk_tokens(tokens, window_size, overlap):
    return [
        {
            "start": start,
            "end": min(start + window_size, len(tokens)),
            "tokens": tokens[start : start + window_size],
        }
        for start in range(0, len(tokens), window_size - overlap)
    ]
