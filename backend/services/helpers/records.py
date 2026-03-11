def max_counter_entries(counter):
    """
    Devuelve (max_value, keys) donde keys son todas las claves que
    tienen el valor máximo.
    """
    if not counter:
        return None, []

    max_value = max(counter.values())

    keys = [
        key
        for key, value in counter.items()
        if value == max_value
    ]

    return max_value, keys