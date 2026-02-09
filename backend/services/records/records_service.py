from collections import defaultdict
from services.results import calculate_results
from schemas.records import RecordDTO


class RecordsService:
    def __init__(self, games_repository):
        self.games_repository = games_repository

    def most_games_played(self) -> RecordDTO | None:
        games = self.games_repository.list_games()

        if not games:
            return None

        games_played_by_player = defaultdict(int)

        for game in games:
            for player in game.players:
                games_played_by_player[player.player_id] += 1

        # buscar el máximo
        player_id, games_played = max(
            games_played_by_player.items(),
            key=lambda item: item[1]
        )

        return RecordDTO(
            type="most_games_played",
            value=games_played,
            player_id=player_id,
            game_id=None,
        )

    def most_games_won(self) -> RecordDTO | None:
        games = self.games_repository.list_games()

        if not games:
            return None

        wins_by_player = defaultdict(int)

        for game in games:
            results = calculate_results(game)

            for result in results.results:
                if result.position == 1:
                    wins_by_player[result.player_id] += 1

        if not wins_by_player:
            return None

        player_id, wins = max(
            wins_by_player.items(),
            key=lambda item: item[1]
        )

        return RecordDTO(
            type="most_games_won",
            value=wins,
            player_id=player_id,
            game_id=None,
        )

    def highest_single_game_score(self) -> RecordDTO | None:
        games = self.games_repository.list_games()

        if not games:
            return None

        max_points = None
        record_player_id = None
        record_game_id = None

        for game in games:
            results = calculate_results(game)

            for result in results.results:
                if max_points is None or result.total_points > max_points:
                    max_points = result.total_points
                    record_player_id = result.player_id
                    record_game_id = game.id

        return RecordDTO(
            type="highest_single_game_score",
            value=max_points,
            player_id=record_player_id,
            game_id=record_game_id,
        )

    def get_global_records(self) -> dict[str, RecordDTO]:
        records = {}

        record = self.most_games_played()
        if record:
            records[record.type] = record

        record = self.most_games_won()
        if record:
            records[record.type] = record

        record = self.highest_single_game_score()
        if record:
            records[record.type] = record

        return records