from models.enums import Milestone
from models.enums import Award
from models.enums import Corporation

def test_milestone_enum_values():
    assert Milestone.MAYOR.value == "Mayor"
    assert Milestone.TERRAFORMER.value == "Terraformer"

def test_milestone_enum_str():
    assert str(Milestone.BUILDER) == "Builder"


def test_award_enum_values():
    assert Award.CELEBRITY.value == "Celebrity"
    assert Award.MAGNATE.value == "Magnate"
    assert Award.TERRAFORMER.value == "Terraformer"

def test_award_enum_str():
    assert str(Award.INDUSTRIALIST) == "Industrialist"


def test_corporation_enum_values():
    assert Corporation.ECOLINE.value == "Ecoline"
    assert Corporation.POSEIDON.value == "Poseidon"
    assert Corporation.SAGITTA.value == "Sagitta"

def test_corporation_str():
    assert str(Corporation.CREDICOR) == "Credicor"