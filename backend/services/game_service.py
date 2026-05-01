from datetime import date

from models.player_result import PlayerResult
from models.award_result import AwardResult
from models.enums import Corporation, Milestone, Award, Expansion
from schemas.game import GameDTO
from schemas.result import GameResultDTO
from services.helpers.results import calculate_results
from mappers.game_mapper import game_dto_to_model, game_model_to_dto
from repositories.game_filters import GameFilter



class GamesService:
    def __init__(self, games_repository, players_repository, elo_service=None):
        self.games_repository = games_repository
        self.players_repository = players_repository
        self.elo_service = elo_service


    def _validate_date(self, game_date: date):
        if game_date > date.today():
            raise ValueError("Game date cannot be in the future")

    def _validate_players(self, players: list[PlayerResult]) -> None:
        if not (2 <= len(players) <= 5):
            raise ValueError("A game must have between 2 and 5 players")

        ids = [p.player_id for p in players]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate players are not allowed")

    def _validate_corporations(self, players: list[PlayerResult]) -> None:
        seen: set = set()
        for player in players:
            corp = player.corporation
            if not corp or not str(corp).strip():
                raise ValueError(
                    f"Player '{player.player_id}' must have a non-empty corporation")
            if corp == Corporation.NOVEL:
                continue  # NOVEL can be chosen by multiple players
            if corp in seen:
                raise ValueError(
                    f"Corporation '{corp}' was chosen by more than one player")
            seen.add(corp)

    def _validate_milestones(self, players: list[PlayerResult]) -> None:
        total = sum(len(player.scores.milestones) for player in players)

        if not (0 <= total <= 3):
            raise ValueError(
                f"Total milestones claimed must be between 0 and 3 (got {total})"
            )
    def _validate_milestone_points_coherence(self, players: list[PlayerResult]) -> None:
        for player in players:
            points = player.scores.milestone_points
            milestones = player.scores.milestones

            min_required_points = len(milestones) * 5

            if points < min_required_points:
                raise ValueError(
                    f"Player '{player.player_id}' has {len(milestones)} milestones "
                    f"({min_required_points} points) but only {points} milestone points"
                )

    def _validate_unique_milestones(self, players: list[PlayerResult]) -> None:
        seen: set[str] = set()

        for player in players:
            for milestone in player.scores.milestones:
                if milestone in seen:
                    raise ValueError(
                        f"Milestone '{milestone}' was claimed by more than one player"
                )
                seen.add(milestone)


    def _validate_awards_count(self, awards: list[AwardResult]) -> None:
        if len(awards) > 3:
            raise ValueError(
                f"A game can have at most 3 awards (got {len(awards)})"
            )

    def _validate_unique_awards(self, awards: list[AwardResult]) -> None:
        award_names = [award.award for award in awards]

        if len(award_names) != len(set(award_names)):
            raise ValueError("Each award can only be claimed once per game")

    def _validate_award_players(self, awards: list[AwardResult], players: list[PlayerResult]) -> None:
        valid_ids = {p.player_id for p in players}

        for award in awards:
            # opened_by
            if award.opened_by not in valid_ids:
                raise ValueError(
                    f"Award '{award.award}' opened_by references unknown player '{award.opened_by}'"
                )

            # first place list
            for p in award.first_place:
                if p not in valid_ids:
                    raise ValueError(
                        f"Award '{award.award}' first_place has unknown player '{p}'"
                    )

            # second place list
            for p in award.second_place:
                if p not in valid_ids:
                    raise ValueError(
                        f"Award '{award.award}' second_place has unknown player '{p}'"
                    )

            # a player cannot be in both first and second place
            for p in award.first_place:
                if p in award.second_place:
                    raise ValueError(
                        f"Award '{award.award}': player '{p}' cannot be in both first and second place"
                    )

    def _validate_award_ties(self, awards: list[AwardResult], player_count: int) -> None:
        for award in awards:
            if len(award.first_place) > 1 and len(award.second_place) > 0:
                raise ValueError(
                    f"Award '{award.award}' has a tie for first place, so second place is not allowed"
                )
            if player_count == 2 and len(award.second_place) > 0:
                raise ValueError(
                    f"Award '{award.award}' cannot have second place in a 2-player game"
                )

    def _validate_players_exist(self, player_results: list[PlayerResult]):
        for pr in player_results:
            try:
                self.players_repository.get(pr.player_id)
            except KeyError:
                raise ValueError(f"Player '{pr.player_id}' is not registered")

    def _validate_venus_requirements(self, game) -> None:
        has_hoverlord = any(
            Milestone.HOVERLORD in player.scores.milestones
            for player in game.player_results
        )
        has_venuphile = any(
            award.award == Award.VENUPHILE
            for award in game.awards
        )
        if (has_hoverlord or has_venuphile) and Expansion.VENUS_NEXT not in game.expansions:
            raise ValueError(
                "Expansion 'Venus Next' is required when using HOVERLORD milestone or VENUPHILE award"
            )

    def create_game(self, game_dto: GameDTO) -> str:
        # Mapear a dominio
        game = game_dto_to_model(game_dto)

        # Validaciones usando modelo dominio
        self._validate_date(game.date)
        self._validate_players(game.player_results)
        self._validate_corporations(game.player_results)
        self._validate_milestones(game.player_results)
        self._validate_milestone_points_coherence(game.player_results)
        self._validate_unique_milestones(game.player_results)
        self._validate_awards_count(game.awards)
        self._validate_unique_awards(game.awards)
        self._validate_award_players(game.awards, game.player_results)
        self._validate_award_ties(game.awards, len(game.player_results))
        self._validate_players_exist(game.player_results)
        self._validate_venus_requirements(game)

        game_id = self.games_repository.create(game)
        game.id = game_id

        self._recompute_elo_from(game.date)
        return game_id


    def list_games(self, filters: GameFilter | None = None) -> list[GameDTO]:
        games = self.games_repository.list_games(filters)
        return [game_model_to_dto(game) for game in games]


    def update_game(self, game_id: str, game_dto: GameDTO) -> None:
        new_game = game_dto_to_model(game_dto)

        old_game = self.games_repository.get(game_id)
        if old_game is None:
            raise ValueError("Game not found")

        self.games_repository.update(game_id, new_game)

        affected_date = min(old_game.date, new_game.date)
        self._recompute_elo_from(affected_date)


    def delete_game(self, game_id: str) -> None:
        """
        Elimina una partida.
        Lanza error si no existe.
        """
        old_game = self.games_repository.get(game_id)
        if old_game is None:
            raise ValueError("Game not found")

        deleted = self.games_repository.delete(game_id)
        if not deleted:
            raise ValueError("Game not found")

        self._recompute_elo_from(old_game.date)

    def get_game_results(self, game_id: str) -> GameResultDTO:
        game = self.games_repository.get(game_id)

        if game is None:
            raise ValueError("Game not found")

        return calculate_results(game)

    def _recompute_elo_from(self, start_date: date) -> None:
        if self.elo_service is None:
            return
        self.elo_service.recompute_from_date(start_date)
