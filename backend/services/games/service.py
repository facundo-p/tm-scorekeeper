from models import GameDTO, GameListItemDTO
from models.player import PlayerDTO
from repositories.games.repository import GamesRepository
from datetime import date
from models import AwardResult
from services.results import calculate_results
from schemas.result import GameResultDTO

class GamesService:
    def __init__(self, repository: GamesRepository):
        self.repository = repository
        #Esto es una instancia de GamesRepository que tiene un diccionario donde guarda las partidas

    def _validate_date(self, game_date: date):
        if game_date > date.today():
            raise ValueError("Game date cannot be in the future")

    def _validate_players(self, players: list[PlayerDTO]) -> None:
        if not (2 <= len(players) <= 5):
            raise ValueError("A game must have between 2 and 5 players")

        ids = [p.player_id for p in players]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate players are not allowed")
        
    def _validate_corporations(self, players: list[PlayerDTO]) -> None:
        for player in players:
            if not player.corporation or not player.corporation.strip():
                raise ValueError(
                    f"Player '{player.player_id}' must have a non-empty corporation")
    
    def _validate_milestones(self, players: list[PlayerDTO]) -> None:
        total = sum(len(player.scores.milestones) for player in players)

        if not (0 <= total <= 3):
            raise ValueError(
                f"Total milestones claimed must be between 0 and 3 (got {total})"
            )
    def _validate_milestone_points_coherence(self, players: list[PlayerDTO]) -> None:
        for player in players:
            points = player.scores.milestone_points
            milestones = player.scores.milestones

            min_required_points = len(milestones) * 5

            if points < min_required_points:
                raise ValueError(
                    f"Player '{player.player_id}' has {len(milestones)} milestones "
                    f"({min_required_points} points) but only {points} milestone points"
                )

    def _validate_unique_milestones(self, players: list[PlayerDTO]) -> None:
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
        
    def _validate_award_players(self, awards: list[AwardResult], players: list[PlayerDTO]) -> None:
        valid_ids = {player.player_id for player in players}

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
    

    def create_game(self, game: GameDTO) -> str:
        self._validate_date(game.date)
        self._validate_players(game.players)
        self._validate_corporations(game.players)
        self._validate_milestones(game.players)
        self._validate_milestone_points_coherence(game.players)
        self._validate_unique_milestones(game.players)
        self._validate_awards_count(game.awards)
        self._validate_unique_awards(game.awards)
        self._validate_award_players(game.awards, game.players)
        self._validate_award_ties(game.awards)
        return self.repository.create(game)

    def list_games(self) -> list[GameDTO]:
        return list(self.repository.list().values())
        
    def update_game(self, game_id: str, game: GameDTO) -> None:
        """
        Actualiza una partida existente.
        Lanza error si no existe.
        """
        updated = self.repository.update(game_id, game)

        if not updated:
            raise ValueError("Game not found")
        
    def delete_game(self, game_id: str) -> None:
        """
        Elimina una partida.
        Lanza error si no existe.
        """
        deleted = self.repository.delete(game_id)

        if not deleted:
            raise ValueError("Game not found")
        
    def get_game_results(self, game_id: str) -> GameResultDTO:
        game = self.repository.get(game_id)

        if game is None:
            raise ValueError("Game not found")

        return calculate_results(game)
    
    def get_game_results(self, game_id: str):
        game = self.repository.get(game_id)

        if game is None:
            raise ValueError("Game not found")

        return calculate_results(game)