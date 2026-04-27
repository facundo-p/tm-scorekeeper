from models.elo_change import EloChange
from schemas.elo import EloChangeDTO


def elo_change_to_dto(change: EloChange, player_name: str) -> EloChangeDTO:
    return EloChangeDTO(
        player_id=change.player_id,
        player_name=player_name,
        elo_before=change.elo_before,
        elo_after=change.elo_after,
        delta=change.delta,
    )


def elo_changes_to_dtos(
    changes: list[EloChange],
    players_by_id: dict[str, str],
) -> list[EloChangeDTO]:
    return [
        elo_change_to_dto(c, players_by_id.get(c.player_id, c.player_id))
        for c in changes
    ]
