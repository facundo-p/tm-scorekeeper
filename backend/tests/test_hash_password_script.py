"""scripts/hash_password.py: pide la contraseña dos veces y solo imprime el hash."""
import pytest

from scripts import hash_password as script
from services.auth_service import verify_password


def answers(monkeypatch, *values):
    it = iter(values)
    monkeypatch.setattr(script.getpass, "getpass", lambda prompt="": next(it))


def test_prints_a_verifiable_hash(monkeypatch, capsys):
    answers(monkeypatch, "marte", "marte")
    assert script.main() == 0
    printed = capsys.readouterr().out.strip()
    assert verify_password("marte", printed)
    assert "marte" not in printed


@pytest.mark.parametrize("first, second", [("", ""), ("marte", "venus")])
def test_rejects_empty_or_mismatch(monkeypatch, capsys, first, second):
    answers(monkeypatch, first, second)
    assert script.main() == 1
    assert capsys.readouterr().out == ""
