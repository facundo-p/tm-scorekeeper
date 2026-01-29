from enum import Enum


class MapName(str, Enum):
    HELLAS = "Hellas"
    THARSIS = "Tharsis"
    ELYSIUM = "Elysium"

class Expansion(str, Enum):
    PRELUDE = "Prelude"
    COLONIES = "Colonies"
    TURMOIL = "Turmoil"