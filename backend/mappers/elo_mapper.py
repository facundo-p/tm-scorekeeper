from db.models import PlayerEloHistory as PlayerEloHistoryORM
from models.elo_change import EloChange
from schemas.elo import EloChangeDTO, EloHistoryPointDTO, PlayerEloHistoryDTO


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


def elo_history_changes_to_player_dto(
    player_id: str,
    player_name: str,
    history_rows: list[PlayerEloHistoryORM],
) -> PlayerEloHistoryDTO:
    """
    Convierte filas ya agrupadas y ya ordenadas (por recorded_at, game_id) en
    PlayerEloHistoryDTO. El mapper NO ordena, NO consulta la BD, NO filtra:
    es una transformación pura. El service garantiza el orden vía el order_by
    del repository (player_id, recorded_at, game_id).
    """
    points = [
        EloHistoryPointDTO(
            recorded_at=r.recorded_at,
            game_id=r.game_id,
            elo_after=r.elo_after,
            delta=r.delta,
        )
        for r in history_rows
    ]
    return PlayerEloHistoryDTO(
        player_id=player_id,
        player_name=player_name,
        points=points,
    )
