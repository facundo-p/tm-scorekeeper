"""Textos de la bitácora (F25, SEMANTICS §11)."""
from services.stats.feed import js_number


def test_numbers_are_written_like_the_mockup():
    assert js_number(10.0) == "10" and js_number(10.3) == "10.3" and js_number(130) == "130"
