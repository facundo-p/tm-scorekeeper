from models.player_result import PlayerResult
from schemas.game import GameDTO
from datetime import date
from models.award_result import AwardResult
from services.results import calculate_results
from schemas.result import GameResultDTO
from mappers.game_mapper import game_dto_to_model
from mappers.game_mapper import game_model_to_dto



class GamesService:
    def __init__(self, games_repository, players_repository):
        self.games_repository = games_repository
        self.players_repository = players_repository


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
        for player in players:
            corp = player.corporation
            # corporation may be an enum or a string; ensure it is not empty
            if not corp or not str(corp).strip():
                raise ValueError(
                    f"Player '{player.player_id}' must have a non-empty corporation")
    
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
        award_names = [award.name for award in awards]

        if len(award_names) != len(set(award_names)):
            raise ValueError("Each award can only be claimed once per game")
        
    def _validate_award_players(self, awards: list[AwardResult], players: list[PlayerResult]) -> None:
        valid_ids = {p.player_id for p in players}

        for award in awards:
            # opened_by
            if award.opened_by not in valid_ids:
                raise ValueError(
                    f"Award '{award.name}' opened_by references unknown player '{award.opened_by}'"
                )

            # first place list
            for p in award.first_place:
                if p not in valid_ids:
                    raise ValueError(
                        f"Award '{award.name}' first_place has unknown player '{p}'"
                    )

            # second place list
            for p in award.second_place:
                if p not in valid_ids:
                    raise ValueError(
                        f"Award '{award.name}' second_place has unknown player '{p}'"
                    )
                
    def _validate_award_ties(self, awards: list[AwardResult]) -> None:
        for award in awards:
            if len(award.first_place) > 1 and len(award.second_place) > 0:
                raise ValueError(
                    f"Award '{award.name}' has a tie for first place, so second place is not allowed"
                )
            
    def _validate_players_exist(self, player_results: list[PlayerResult]):
        for pr in player_results:
            try:
                self.players_repository.get(pr.player_id)
            except KeyError:
                raise ValueError(f"Player '{pr.player_id}' is not registered")
    

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
        self._validate_award_ties(game.awards)
        self._validate_players_exist(game.player_results)

        return self.games_repository.create(game)


    def list_games(self) -> list[GameDTO]:
        games = self.games_repository.list().values()
        return [game_model_to_dto(game) for game in games]

        
    def update_game(self, game_id: str, game_dto: GameDTO) -> None:
        game = game_dto_to_model(game_dto)

        updated = self.games_repository.update(game_id, game)

        if not updated:
            raise ValueError("Game not found")

        
    def delete_game(self, game_id: str) -> None:
        """
        Elimina una partida.
        Lanza error si no existe.
        """
        deleted = self.games_repository.delete(game_id)

        if not deleted:
            raise ValueError("Game not found")
        
    def get_game_results(self, game_id: str) -> GameResultDTO:
        game = self.games_repository.get(game_id)

        if game is None:
            raise ValueError("Game not found")

        return calculate_results(game)