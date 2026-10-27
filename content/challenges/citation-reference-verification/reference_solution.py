import unicodedata


def verify_citations(claims: list[dict], sources: list[dict]) -> dict:
    def normalized(text):
        return " ".join(unicodedata.normalize("NFC", text).split())

    if (
        not isinstance(claims, list)
        or len(claims) > 100
        or not isinstance(sources, list)
        or len(sources) > 100
    ):
        raise ValueError("At most 100 claims and 100 sources")
    indexed, total = {}, 0
    for source in sources:
        if (
            not isinstance(source, dict)
            or not isinstance(source.get("id"), str)
            or not source["id"]
            or source["id"] in indexed
            or not isinstance(source.get("text"), str)
        ):
            raise ValueError("Source IDs must be unique with text bodies")
        total += len(source["text"])
        indexed[source["id"]] = normalized(source["text"])
    if total > 100000:
        raise ValueError("Source text budget exceeded")
    results = []
    for index, claim in enumerate(claims):
        if (
            not isinstance(claim, dict)
            or not isinstance(claim.get("text"), str)
            or not claim["text"].strip()
            or len(claim["text"]) > 2000
        ):
            raise ValueError("Claims need nonblank text of at most 2000 characters")
        citations = claim.get("citations", [])
        if not isinstance(citations, list) or len(citations) > 20:
            raise ValueError("At most 20 citations per claim")
        errors = [] if citations else ["missing_citation"]
        for citation_index, citation in enumerate(citations):
            error = None
            if (
                not isinstance(citation, dict)
                or not isinstance(citation.get("source_id"), str)
                or not citation["source_id"]
                or not isinstance(citation.get("quote"), str)
                or len(citation["quote"]) > 2000
            ):
                error = "invalid_citation"
            elif citation["source_id"] not in indexed:
                error = "unknown_source"
            else:
                quote = normalized(citation["quote"])
                if not quote:
                    error = "empty_quote"
                elif quote not in indexed[citation["source_id"]]:
                    error = "quote_not_found"
            if error:
                errors.append(f"citation {citation_index}: {error}")
        results.append({"index": index, "references_valid": not errors, "errors": errors})
    return {
        "all_references_valid": bool(results) and all(row["references_valid"] for row in results),
        "claims": results,
    }
