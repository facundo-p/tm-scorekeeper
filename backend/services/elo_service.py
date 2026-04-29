from datetime import date
from typing import Optional

from mappers.elo_mapper import elo_history_changes_to_player_dto
from models.elo_change import EloChange
from models.game import Game
from repositories.elo_filters import EloHistoryFilter
from schemas.elo import PlayerEloHistoryDTO
from schemas.elo_summary import EloRankDTO, PlayerEloSummaryDTO
from services.helpers.results import calculate_results


K_FACTOR = 32
DEFAULT_ELO = 1000


def _expected_score(rating_a: int, rating_b: int) -> float:
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400))


def _actual_score(position_a: int, position_b: int) -> float:
    if position_a < position_b:
        return 1.0
    if position_a > position_b:
        return 0.0
    return 0.5


def calculate_elo_changes(
    game: Game,
    current_elo_by_player: dict[str, int],
) -> list[EloChange]:
    """
    Calcula los cambios de ELO para todos los jugadores de una partida usando
    comparaciones por pares (cada jugador se enfrenta a todos los demás).

    Args:
        game: la partida ya rankeada (se usa calculate_results para las posiciones).
        current_elo_by_player: mapa player_id -> ELO actual antes de la partida.

    Returns:
        Lista de EloChange con elo_before, elo_after y delta por jugador.
    """
    results = calculate_results(game).results
    positions = {r.player_id: r.position for r in results}
    player_ids = [r.player_id for r in results]

    changes: list[EloChange] = []
    for player_id in player_ids:
        elo_before = current_elo_by_player[player_id]
        delta_sum = 0.0

        for opponent_id in player_ids:
            if opponent_id == player_id:
                continue

            opponent_elo = current_elo_by_player[opponent_id]
            expected = _expected_score(elo_before, opponent_elo)
            actual = _actual_score(positions[player_id], positions[opponent_id])
            delta_sum += (actual - expected)

        delta = round(K_FACTOR * delta_sum)
        changes.append(
            EloChange(
                player_id=player_id,
                elo_before=elo_before,
                elo_after=elo_before + delta,
                delta=delta,
            )
        )

    return changes


class EloService:
    """
    Encapsula la persistencia y recomputación de ELO.

    `recompute_from_date` es la única vía de mutación: dada una fecha de partida
    afectada, re-procesa todas las partidas con date >= start_date en orden
    cronológico, dejando el historial y players.elo consistentes.
    """

    def __init__(self, elo_repository, players_repository, games_repository):
        self.elo_repository = elo_repository
        self.players_repository = players_repository
        self.games_repository = games_repository

    def recompute_from_date(self, start_date: date) -> None:
        baseline = self._build_baseline(start_date)
        self.elo_repository.delete_changes_from_date(start_date)
        games = self.games_repository.list_games_from_date(start_date)
        self._walk_and_persist(games, baseline)
        self.players_repository.bulk_update_elo(baseline)

    def recompute_all(self) -> None:
        self.recompute_from_date(date.min)

    def _build_baseline(self, start_date: date) -> dict[str, int]:
        baseline = {p.player_id: DEFAULT_ELO for p in self.players_repository.get_all()}
        baseline.update(self.elo_repository.get_baseline_elo_before(start_date))
        return baseline

    def _walk_and_persist(self, games: list[Game], baseline: dict[str, int]) -> None:
        games.sort(key=lambda g: (g.date, g.id))
        for game in games:
            for pr in game.player_results:
                baseline.setdefault(pr.player_id, DEFAULT_ELO)
            snapshot = {
                pr.player_id: baseline[pr.player_id]
                for pr in game.player_results
            }
            changes = calculate_elo_changes(game, snapshot)
            self.elo_repository.save_elo_changes(
                game_id=game.id,
                recorded_at=game.date,
                changes=changes,
            )
            for c in changes:
                baseline[c.player_id] = c.elo_after

    def get_summary_for_player(self, player_id: str) -> PlayerEloSummaryDTO:
        """Return the ELO summary for a single player.

        Tie-breaking: when active players share the same `elo`, ranking is
        stable by ascending `player_id` (NOT dense rank — CONTEXT D-06).
        A player with 0 games has current_elo = DEFAULT_ELO (1000), peak_elo
        = None and last_delta = None (D-05). Inactive players have rank =
        None (D-04 / D-18 — rank is scoped to active players).
        Raises KeyError when the player does not exist (route → 404).
        """
        player = self.players_repository.get(player_id)  # raises KeyError → 404

        peak = self.elo_repository.get_peak_for_player(player_id)
        last_change = self.elo_repository.get_last_change_for_player(player_id)
        last_delta = last_change.delta if last_change is not None else None

        rank = self._compute_rank(player_id) if player.is_active else None

        return PlayerEloSummaryDTO(
            current_elo=player.elo,
            peak_elo=peak,
            last_delta=last_delta,
            rank=rank,
        )

    def _compute_rank(self, player_id: str) -> EloRankDTO | None:
        """1-based position in active-players ranking (CONTEXT D-04, D-06)."""
        ranked = self.players_repository.get_active_players_ranked()
        for idx, p in enumerate(ranked):
            if p.player_id == player_id:
                return EloRankDTO(position=idx + 1, total=len(ranked))
        return None

    def get_history(
        self,
        date_from: Optional[date] = None,
        player_ids: Optional[set[str]] = None,
    ) -> list[PlayerEloHistoryDTO]:
        """
        Devuelve la serie temporal de ELO por jugador.

        - Sin player_ids: candidatos = jugadores activos (is_active == True).
        - Con player_ids: candidatos = ids explícitos (activos o no);
          ids desconocidos se descartan silenciosamente.
        - Jugadores sin historial en la ventana se omiten del resultado.
        - Orden top-level: ascendente por player_name (determinístico para tests).
        """
        candidate_ids, names_by_id = self._resolve_candidates(player_ids)
        if not candidate_ids:
            return []

        rows = self.elo_repository.get_history(
            EloHistoryFilter(date_from=date_from, player_ids=candidate_ids)
        )

        rows_by_player: dict[str, list] = {}
        for r in rows:
            rows_by_player.setdefault(r.player_id, []).append(r)

        return [
            elo_history_changes_to_player_dto(
                player_id=pid,
                player_name=names_by_id[pid],
                history_rows=rows_by_player[pid],
            )
            for pid in sorted(rows_by_player.keys(), key=lambda p: names_by_id[p])
        ]

    def _resolve_candidates(
        self,
        player_ids: Optional[set[str]],
    ) -> tuple[set[str], dict[str, str]]:
        """
        Resuelve el conjunto de candidatos y el mapa player_id->name en una sola pasada
        sobre players_repository.get_all().

        - player_ids None  -> activos (is_active == True).
        - player_ids set   -> intersección con players existentes (unknown ids dropped).
        """
        all_players = self.players_repository.get_all()
        names_by_id = {p.player_id: p.name for p in all_players}
        if player_ids is None:
            candidate_ids = {p.player_id for p in all_players if p.is_active}
        else:
            candidate_ids = {pid for pid in player_ids if pid in names_by_id}
        return candidate_ids, names_by_id
