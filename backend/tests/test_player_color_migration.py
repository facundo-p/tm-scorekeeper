"""Backfill de colores de la migración f2a3b4c5d6e7 (F24, STAT-08, D-65)."""
import importlib.util
from pathlib import Path

import pytest

_PATH = Path(__file__).resolve().parents[1] / "db/migrations/versions/f2a3b4c5d6e7_player_color.py"
_spec = importlib.util.spec_from_file_location("player_color_migration", _PATH)
migration = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(migration)


def test_active_players_take_the_first_free_color_in_order():
    rows = [("b", True), ("a", True), ("x", False), ("c", True)]
    assert migration._assign(rows) == {"b": "rojo", "a": "verde", "x": "azul", "c": "azul"}


def test_inactive_players_take_the_color_of_their_position_and_may_repeat():
    rows = [(f"i{n}", False) for n in range(12)]
    colors = migration._assign(rows)
    assert colors["i0"] == colors["i10"] == "rojo" and colors["i11"] == "verde"


def test_more_than_ten_active_players_abort_the_migration():
    with pytest.raises(RuntimeError):
        migration._assign([(f"p{n}", True) for n in range(11)])


def test_the_migration_colors_match_the_catalog():
    from models.player_colors import PLAYER_COLORS
    assert migration.COLORS == PLAYER_COLORS
