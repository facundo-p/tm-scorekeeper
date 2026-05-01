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
        player = self.players_repository.get(player_id)

        games = self.games_repository.get_games_by_player(player_id)

        games_played = len(games)
        games_won = 0
        summaries = []
        total_milestones = 0
        total_awards = 0
        
        for game in games:
            game_results = calculate_results(game)
            #devuelve GameResultDTO con player_id, total_points, mc_total, position, tied

            total_awards += sum(player_id in award.first_place for award in game.awards)
            # Suma todas las recompensas obtenidas por el jugador (solo si tiene el 1er lugar) en cada premio).

            player_results_by_id = {
                pr.player_id: pr
                for pr in game.player_results
            }
            """Crea un diccionario para acceder rápidamente a los resultados del jugador
            en el juego actual, usando player_id como clave."""

            for game_result in game_results.results:
                if game_result.player_id == player_id:
                # Obtener el resultado del jugador para este juego

                    player_model_result = player_results_by_id[player_id]
                    # buscar el resultado del jugador en la lista original de resultados

                    total_milestones += len(player_model_result.scores.milestones)
                    # Cuenta la cantidad de hitos obtenidos en la partida y los suma al total.

                    if game_result.position == 1:
                        games_won += 1

                    summaries.append(
                        PlayerGameSummaryDTO(
                            game_id=game.id,
                            date=game.date,
                            position=game_result.position,
                            points=game_result.total_points,
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
            elo=player.elo,
            stats=stats,
            games=summaries,
            records=records,
        )

