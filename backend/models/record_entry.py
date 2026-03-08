from dataclasses import dataclass, field
from typing import Optional

LABEL_PLAYER = "Jugador"
LABEL_DATE = "Fecha"


@dataclass
class RecordAttribute:
    label: str
    value: str  # para LABEL_PLAYER, guarda player_id (el mapper lo resuelve a nombre)


@dataclass
class RecordEntry:
    value: int
    attributes: list[RecordAttribute] = field(default_factory=list)


def get_player_id(entry: RecordEntry) -> Optional[str]:
    """Extrae el player_id del atributo LABEL_PLAYER, si existe."""
    for attr in entry.attributes:
        if attr.label == LABEL_PLAYER:
            return attr.value
    return None
