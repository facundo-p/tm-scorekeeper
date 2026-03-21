from schemas.player_profile import (
    PlayerProfileDTO,
    PlayerStatsDTO,
    PlayerGameSummaryDTO,
)
from services.helpers.results import calculate_results


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
        total_milestones = 0
        total_awards = 0
        
        for game in games:
            results = calculate_results(game)

            # awards (esto ya estaba bien)
            player_awards = sum(
                1 for award in game.awards
                if player_id in award.first_place
            )
            total_awards += player_awards

            for result in results.results:
                if result.player_id == player_id:

                    game_player_result = next(
                        pr for pr in game.player_results
                        if pr.player_id == player_id
                    )

                    total_milestones += len(game_player_result.scores.milestones)

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

        avg_milestones = (
            total_milestones / games_played
            if games_played > 0 else 0.0
        )

        avg_awards = (
            total_awards / games_played
            if games_played > 0 else 0.0
        )

        avg_milestones = round(avg_milestones, 2)
        avg_awards = round(avg_awards, 2)

        stats = PlayerStatsDTO(
            games_played=games_played,
            games_won=games_won,
            win_rate=win_rate,
            avg_milestones=avg_milestones,
            avg_awards=avg_awards,
        )
        
        records = self.player_records_service.get_player_records(player_id)

        # usar directamente el id
        return PlayerProfileDTO(
            player_id=player_id,
            stats=stats,
            games=summaries,
            records=records,
        )    

