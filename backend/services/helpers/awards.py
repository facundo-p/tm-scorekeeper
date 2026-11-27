"""Recompensas robadas: el 1.º en solitario no es quien la financió (SEMANTICS §5)."""
from models.award_result import AwardResult


def stolen_awards(game) -> list[AwardResult]:
    return [a for a in game.awards if len(a.first_place) == 1 and a.first_place[0] != a.opened_by]
