from schemas.player_profile import (
    PlayerProfileDTO,
    PlayerStatsDTO,
    PlayerGameSummaryDTO,
)
from services.results import calculate_results


class PlayerProfileService:

    def __init__(
        self,
        players_repository,
        games_repository,
        player_records_service,
    ):
        self.players_repository = players_repository
        self.games_repository = games_repository
        self.player_records_service = player_records_service

    def get_profile(self, player_id: str) -> PlayerProfileDTO:
        
        # validar que el jugador exista
        self.players_repository.get(player_id)

        games = self.games_repository.get_games_by_player(player_id)

        games_played = len(games)
        games_won = 0
        summaries = []
        
        for game in games:
            results = calculate_results(game)

            for result in results.results:
                if result.player_id == player_id:
                    if result.position == 1:
                        games_won += 1

                    summaries.append(
                        PlayerGameSummaryDTO(
                            game_id=game.id,
                            date=game.date,
                            position=result.position,
                            points=result.total_points,
                        )
                    )

        win_rate = (
            games_won / games_played
            if games_played > 0
            else 0.0
        )

        stats = PlayerStatsDTO(
            games_played=games_played,
            games_won=games_won,
            win_rate=win_rate,
        )
        
        records = self.player_records_service.get_player_records(player_id)

        # usar directamente el id
        return PlayerProfileDTO(
            player_id=player_id,
            stats=stats,
            games=summaries,
            records=records,
        )    

