def backoff_delays(
    attempts: int, base_delay: float, max_delay: float, jitter: float, random_values: list[float]
) -> list[float]:
    raise NotImplementedError("Plan capped delays using injected random samples")
