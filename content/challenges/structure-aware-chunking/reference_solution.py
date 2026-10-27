def chunk_sections(blocks: list[dict], max_tokens: int) -> list[dict]:
    if type(max_tokens) is not int or not 1 <= max_tokens <= 2048:
        raise ValueError("max_tokens must be in 1–2048")
    if not isinstance(blocks, list) or len(blocks) > 500:
        raise ValueError("At most 500 parsed blocks")
    total = 0
    for block in blocks:
        if not isinstance(block, dict):
            raise ValueError("Expected parsed blocks")
        kind = block.get("type")
        if kind == "heading":
            if (
                type(block.get("level")) is not int
                or not 1 <= block["level"] <= 6
                or not isinstance(block.get("title"), str)
                or not block["title"].strip()
            ):
                raise ValueError("Invalid heading")
        elif kind in ("paragraph", "table"):
            groups = [block.get("tokens")] if kind == "paragraph" else block.get("rows")
            if not isinstance(groups, list):
                raise ValueError("Invalid block tokens")
            for tokens in groups:
                if not isinstance(tokens, list) or any(
                    not isinstance(t, str) or not t for t in tokens
                ):
                    raise ValueError("Expected nonempty token strings")
                if kind == "table" and (not tokens or len(tokens) > max_tokens):
                    raise ValueError("Table rows must be nonempty and fit the budget")
                total += len(tokens)
        else:
            raise ValueError("Unknown parsed block type")
    if total > 20000:
        raise ValueError("Document token budget exceeded")
    chunks, headings, pending = [], [], []
    pending_count = 0

    def emit(items):
        if items:
            chunks.append({"heading_path": [title for _, title in headings], "blocks": items})

    def flush():
        nonlocal pending, pending_count
        emit(pending)
        pending, pending_count = [], 0

    for block in blocks:
        kind = block["type"]
        if kind == "heading":
            flush()
            headings = [(level, title) for level, title in headings if level < block["level"]]
            headings.append((block["level"], block["title"].strip()))
        elif kind == "paragraph":
            tokens = block["tokens"]
            if not tokens:
                continue
            if len(tokens) > max_tokens:
                flush()
                for start in range(0, len(tokens), max_tokens):
                    part = tokens[start : start + max_tokens]
                    if len(part) == max_tokens:
                        emit([{"type": "paragraph", "tokens": part}])
                    else:
                        pending, pending_count = [{"type": "paragraph", "tokens": part}], len(part)
            else:
                if pending_count + len(tokens) > max_tokens:
                    flush()
                pending.append({"type": "paragraph", "tokens": tokens[:]})
                pending_count += len(tokens)
        else:
            flush()
            rows, size = [], 0
            for row in block["rows"]:
                if size + len(row) > max_tokens:
                    emit([{"type": "table", "rows": rows}])
                    rows, size = [], 0
                rows.append(row[:])
                size += len(row)
            if rows:
                emit([{"type": "table", "rows": rows}])
    flush()
    return chunks
