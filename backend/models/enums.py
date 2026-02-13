from enum import Enum


class MapName(str, Enum):
    HELLAS = "Hellas"
    THARSIS = "Tharsis"
    ELYSIUM = "Elysium"

class Expansion(str, Enum):
    PRELUDE = "Prelude"
    COLONIES = "Colonies"
    TURMOIL = "Turmoil"
    VENUS_NEXT   = "Venus next"

class Milestone(Enum):
    #Tharsis
    TERRAFORMER     = "Terraformer"
    MAYOR           = "Mayor"
    GARDENER        = "Gardener"
    BUILDER         = "Builder"
    PLANNER         = "Planner"

    # Elysium
    GENERALIST      = "Generalist"
    SPECIALIST      = "Specialist"
    ECOLOGIST       = "Ecologist"
    TYCOON          = "Tycoon"
    LEGEND          = "Legend"

    #Hellas
    DIVERSIFIER     = "Diversifier"
    TACTICIAN       = "Tactician"
    POLAR_EXPLORER  = "Polar Explorer"
    ENERGIZER       = "Energizer"
    RIM_SETTLER     = "Rim Settler"

    def __str__(self) -> str:
        return self.value
    
from enum import Enum


class Award(Enum):
    # Tharsis
    TERRAFORMER = "Terraformer"
    MAYOR = "Mayor"
    GARDENER = "Gardener"
    BUILDER = "Builder"
    PLANNER = "Planner"

    # Hellas
    CULTIVATOR = "Cultivator"
    MAGNATE = "Magnate"
    SPACE_BARON = "Space Baron"
    EXCENTRIC = "Excentric"
    CONTRACTOR = "Contractor"

    # Elysium
    CELEBRITY = "Celebrity"
    INDUSTRIALIST = "Industrialist"
    DESERT_SETTLER = "Desert Settler"
    ESTATE_DEALER = "Estate Dealer"
    BENEFACTOR = "Benefactor"

    def __str__(self) -> str:
        return self.value


from enum import Enum


class Corporation(Enum):
    # --- Base Game ---
    CREDICOR = "Credicor"
    ECOLINE = "Ecoline"
    HELION = "Helion"
    INTERPLANETARY_CINEMATICS = "Interplanetary Cinematics"
    INVENTRIX = "Inventrix"
    MINING_GUILD = "Mining Guild"
    PHOBOLOG = "Phobolog"
    SATURN_SYSTEMS = "Saturn Systems"
    THARSIS_REPUBLIC = "Tharsis Republic"
    THORGATE = "Thorgate"

    # --- Prelude ---
    POINT_LUNA = "Point Luna"
    ROBINSON_INDUSTRIES = "Robinson Industries"
    VALLEY_TRUST = "Valley Trust"
    VITOR = "Vitor"
    ARCADIAN_COMMUNITIES = "Arcadian Communities"

    # --- Venus Next ---
    APHRODITE = "Aphrodite"
    CELESTIC = "Celestic"
    MANUTECH = "Manutech"
    MORNING_STAR_INC = "Morning Star Inc."
    VIRON = "Viron"

    # --- Colonies ---
    ARIDOR = "Aridor"
    POLYPHEMOS = "Polyphemos"
    POSEIDON = "Poseidon"
    STORMCRAFT = "Stormcraft Incorporated"
    TERRALABS_RESEARCH = "Terralabs Research"

    # --- Turmoil ---
    SEPTEM_TRIBUS = "Septem Tribus"
    SPLICE_TACTICAL_GENOMICS = "Splice Tactical Genomics"
    TERACTOR = "Teractor"
    UTOPIA_INVEST = "Utopia Invest"

    # --- Prelude 2 ---
    CHEUNG_SHING_MARS = "Cheung Shing Mars"
    FACTORUM = "Factorum"
    MONS_INSURANCE = "Mons Insurance"
    RECYCLON = "Recyclon"
    SAGITTA = "Sagitta"

    def __str__(self) -> str:
        return self.value

