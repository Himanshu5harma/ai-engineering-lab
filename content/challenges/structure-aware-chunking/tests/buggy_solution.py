def chunk_sections(blocks, max_tokens):
    result = []
    for block in blocks:
        if block.get("type") == "paragraph":
            result.append(
                {
                    "heading_path": [],
                    "blocks": [{"type": "paragraph", "tokens": block["tokens"][:max_tokens]}],
                }
            )
    return result
