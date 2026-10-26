def reciprocal_rank_fusion(
    lexical: list[str], semantic: list[str], k: int = 60
) -> list[dict[str, str | float]]:
    """Fuse two rankings using first-occurrence ranks and deterministic ties."""
    raise NotImplementedError("Implement validated reciprocal rank fusion")
