from models.enums import Milestone
from models.enums import Award
from models.enums import Corporation

def test_milestone_enum_contract():
    expected = {
        # Tharsis
        "Terraformer", "Mayor", "Gardener", "Builder", "Planner",
        # Elysium
        "Generalist", "Specialist", "Ecologist", "Tycoon", "Legend",
        # Hellas
        "Diversifier", "Tactician", "Polar Explorer", "Energizer", "Rim Settler",
        # Vastitas Borealis
        "Agronomist", "Engineer", "Spacecrafter", "Geologist", "Farmer",
        # Amazonis Planitia
        "Terran", "Landshaper", "Merchant", "Sponsor", "Lobbyist",
    }

    actual = {m.value for m in Milestone}
    assert actual == expected


def test_award_enum_contract():
    expected = {
        # Tharsis
        "Landlord", "Banker", "Scientist", "Thermalist", "Miner",
        # Hellas
        "Cultivator", "Magnate", "Space Baron", "Excentric", "Contractor",
        # Elysium
        "Celebrity", "Industrialist", "Desert Settler", "Estate Dealer", "Benefactor",
        # Vastitas Borealis
        "Traveller", "Landscaper", "Highlander", "Promoter", "Blacksmith",
        # Amazonis Planitia
        "Collector", "Innovator", "Constructor", "Manufacturer", "Physicist",
    }

    actual = {a.value for a in Award}
    assert actual == expected


def test_corporation_enum_contract():
    expected = {
        "Credicor",
        "Ecoline",
        "Helion",
        "Interplanetary Cinematics",
        "Inventrix",
        "Mining Guild",
        "Phobolog",
        "Saturn Systems",
        "Tharsis Republic",
        "Thorgate",
        "Point Luna",
        "Robinson Industries",
        "Valley Trust",
        "Vitor",
        "Arcadian Communities",
        "Aphrodite",
        "Celestic",
        "Manutech",
        "Morning Star Inc.",
        "Viron",
        "Aridor",
        "Polyphemos",
        "Poseidon",
        "Stormcraft Incorporated",
        "Terralabs Research",
        "Septem Tribus",
        "Splice Tactical Genomics",
        "Teractor",
        "Utopia Invest",
        "Cheung Shing Mars",
        "Factorum",
        "Mons Insurance",
        "Recyclon",
        "Sagitta",
    }

    actual = {c.value for c in Corporation}
    assert actual == expected
