import logging

from services.achievement_evaluators.registry import ALL_EVALUATORS
from mappers.achievement_mapper import (
    evaluation_result_to_unlocked_dto,
    build_player_achievement_dto,
    build_catalog_item_dto,
)
from schemas.achievement import (
    AchievementUnlockedDTO,
    PlayerAchievementDTO,
    AchievementCatalogItemDTO,
)

logger = logging.getLogger(__name__)


class AchievementsService:
    def __init__(self, games_repository, achievement_repository, players_repository):
        self.games_repository = games_repository
        self.achievement_repository = achievement_repository
        self.players_repository = players_repository

    def evaluate_for_game(self, game_id: str) -> dict[str, list[AchievementUnlockedDTO]]:
        """
        Evaluate all achievements for every player in the game.

        Returns a dict mapping player_id -> list of newly unlocked/upgraded DTOs.
        Only players with at least one change appear in the result.
        Never raises — returns {} on any error.
        """
        try:
            game = self.games_repository.get(game_id)
            if game is None:
                return {}

            player_ids = [pr.player_id for pr in game.player_results]
            result: dict[str, list[AchievementUnlockedDTO]] = {}

            for player_id in player_ids:
                # Bulk-load games once per player (INTG-02: no N+1)
                games = self.games_repository.get_games_by_player(player_id)
                persisted = {
                    a.code: a.tier
                    for a in self.achievement_repository.get_for_player(player_id)
                }

                unlocked: list[AchievementUnlockedDTO] = []
                for evaluator in ALL_EVALUATORS:
                    current_tier = persisted.get(evaluator.code, 0)
                    eval_result = evaluator.evaluate(player_id, games, current_tier)
                    if eval_result.new_tier is not None:
                        self.achievement_repository.upsert(
                            player_id, evaluator.code, eval_result.new_tier
                        )
                        unlocked.append(evaluation_result_to_unlocked_dto(evaluator, eval_result))

                if unlocked:
                    result[player_id] = unlocked

            return result

        except Exception:
            logger.exception("Error evaluating achievements for game %s", game_id)
            return {}

    def get_player_achievements(self, player_id: str) -> list[PlayerAchievementDTO]:
        """
        Return all achievements for a player (locked + unlocked).
        Progress is computed on-demand for show_progress=True evaluators.
        """
        persisted = {
            a.code: (a.tier, a.unlocked_at)
            for a in self.achievement_repository.get_for_player(player_id)
        }
        games = self.games_repository.get_games_by_player(player_id)

        result: list[PlayerAchievementDTO] = []
        for evaluator in ALL_EVALUATORS:
            tier, unlocked_at = persisted.get(evaluator.code, (0, None))
            progress = None
            if evaluator.definition.show_progress:
                progress = evaluator.get_progress(player_id, games, tier)
            result.append(
                build_player_achievement_dto(evaluator, tier, unlocked_at, progress)
            )

        return result

    def get_catalog(self) -> list[AchievementCatalogItemDTO]:
        """
        Return all achievement definitions with holders (players who unlocked them).
        """
        all_achievements = self.achievement_repository.get_all()
        players = {p.player_id: p.name for p in self.players_repository.get_all()}

        holders_by_code: dict[str, list[tuple]] = {}
        for a in all_achievements:
            entry = (a.player_id, players.get(a.player_id, "Unknown"), a.tier, a.unlocked_at)
            holders_by_code.setdefault(a.code, []).append(entry)

        result: list[AchievementCatalogItemDTO] = []
        for evaluator in ALL_EVALUATORS:
            holders = holders_by_code.get(evaluator.code, [])
            result.append(build_catalog_item_dto(evaluator, holders))

        return result
