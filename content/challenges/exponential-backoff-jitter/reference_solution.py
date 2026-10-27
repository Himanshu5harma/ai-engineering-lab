import math


def backoff_delays(
    attempts: int, base_delay: float, max_delay: float, jitter: float, random_values: list[float]
) -> list[float]:
    if type(attempts) is not int or not 0 <= attempts <= 30:
        raise ValueError("attempts must be in 0–30")

    def finite_number(value):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError("Expected a finite number")
        try:
            finite = math.isfinite(value)
        except OverflowError:
            raise ValueError("Number outside float range") from None
        if not finite:
            raise ValueError("Expected a finite number")

    for value in (base_delay, max_delay, jitter):
        finite_number(value)
    if base_delay <= 0 or max_delay <= 0 or not 0 <= jitter <= 1:
        raise ValueError("Delays must be positive; jitter is in [0,1]")
    if not isinstance(random_values, list) or len(random_values) != attempts:
        raise ValueError("Provide one deterministic random value per attempt")
    for value in random_values:
        finite_number(value)
        if not 0 <= value <= 1:
            raise ValueError("Random inputs must be in [0,1]")
    result = []
    raw = min(base_delay, max_delay)
    for value in random_values:
        result.append(raw * (1 - jitter + jitter * value))
        raw = min(max_delay, raw * 2)
    return result
