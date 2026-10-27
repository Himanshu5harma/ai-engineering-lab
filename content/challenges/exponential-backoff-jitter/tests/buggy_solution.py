def backoff_delays(attempts, base_delay, max_delay, jitter, random_values):
    return [min(max_delay, base_delay * 2**i) + jitter * u for i, u in enumerate(random_values)]
