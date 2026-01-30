from datetime import date

from models import GameDTO, PlayerDTO, ScoresDTO, EndStatsDTO
from schemas.player_profile import PlayerStatsDTO

def test_player_with_no_games_has_zero_stats():
    stats = PlayerStatsDTO(
        games_played=0,
        games_won=0,
        win_rate=0.0
    )

    assert stats.games_played == 0
    assert stats.games_won == 0
    assert stats.win_rate == 0.0

def test_player_with_one_win_has_100_percent_win_rate():
    games_played = 1
    games_won = 1

    win_rate = games_won / games_played

    stats = PlayerStatsDTO(
        games_played=games_played,
        games_won=games_won,
        win_rate=win_rate
    )

    assert stats.games_played == 1
    assert stats.games_won == 1
    assert stats.win_rate == 1.0

def test_player_with_multiple_games_has_correct_win_rate():
    games_played = 5
    games_won = 2

    win_rate = games_won / games_played

    stats = PlayerStatsDTO(
        games_played=games_played,
        games_won=games_won,
        win_rate=win_rate
    )

    assert stats.games_played == 5
    assert stats.games_won == 2
    assert stats.win_rate == 0.4
