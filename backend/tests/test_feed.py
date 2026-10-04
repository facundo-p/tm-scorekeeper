"""Textos de la bitácora (F25, SEMANTICS §11)."""
from services.stats.feed import js_number


def test_numbers_are_written_like_the_mockup():
    assert js_number(10.0) == "10" and js_number(10.3) == "10.3" and js_number(130) == "130"


def test_a_season_without_champion_says_so():
    from services.stats.feed import _season_text
    names = {"p1": "Ana"}
    assert _season_text({"number": 2, "champion": None}, names).endswith("Sin campeón")
    assert _season_text({"number": 1, "champion": "p1"}, names).endswith("Campeón: Ana")
