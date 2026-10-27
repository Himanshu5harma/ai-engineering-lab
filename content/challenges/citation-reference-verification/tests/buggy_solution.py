def verify_citations(claims, sources):
    ids = {source["id"] for source in sources}
    rows = [
        {
            "index": i,
            "references_valid": all(c["source_id"] in ids for c in claim.get("citations", [])),
            "errors": [],
        }
        for i, claim in enumerate(claims)
    ]
    return {"all_references_valid": all(row["references_valid"] for row in rows), "claims": rows}
