from models.record_entry import LABEL_DATE, LABEL_PLAYER, RecordAttribute, RecordEntry


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

def best_with_holders(candidates):
    """(valor máximo, poseedores) de una secuencia (valor, player_id, fecha) en orden canónico.

    Todos los que alcanzan el máximo son poseedores (D-05); cada jugador aparece una vez, con
    la primera fecha en que lo alcanzó.
    """
    best = None
    holders: dict[str, object] = {}
    for value, player_id, when in candidates:
        if best is None or value > best:
            best, holders = value, {}
        if value == best and player_id not in holders:
            holders[player_id] = when
    return best, list(holders.items())


def holders_entry(value, holders, title):
    """RecordEntry con un par Jugador/Fecha por poseedor."""
    attributes = []
    for player_id, when in holders:
        attributes += [RecordAttribute(label=LABEL_PLAYER, value=player_id),
                       RecordAttribute(label=LABEL_DATE, value=str(when))]
    return RecordEntry(value=value, title=title, attributes=attributes)
