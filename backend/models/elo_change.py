from dataclasses import dataclass


@dataclass
class EloChange:
    player_id: str
    elo_before: int
    elo_after: int
    delta: int
