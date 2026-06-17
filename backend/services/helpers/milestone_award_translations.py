from models.enums import Milestone, Award

MILESTONE_TRANSLATIONS = {
    # Tharsis
    Milestone.TERRAFORMER: "Terraformador",
    Milestone.MAYOR: "Alcalde",
    Milestone.GARDENER: "Jardinero",
    Milestone.BUILDER: "Constructor",
    Milestone.PLANNER: "Planificador",
    # Elysium
    Milestone.GENERALIST: "Generalista",
    Milestone.SPECIALIST: "Especialista",
    Milestone.ECOLOGIST: "Ecólogo",
    Milestone.TYCOON: "Magnate",
    Milestone.LEGEND: "Leyenda",
    # Hellas
    Milestone.DIVERSIFIER: "Diversificador",
    Milestone.TACTICIAN: "Táctico",
    Milestone.POLAR_EXPLORER: "Explorador Polar",
    Milestone.ENERGIZER: "Energizador",
    Milestone.RIM_SETTLER: "Colonizador del Borde",
    # Vastitas Borealis
    Milestone.AGRONOMIST: "Agrónomo",
    Milestone.ENGINEER: "Ingeniero",
    Milestone.SPACECRAFTER: "Artesano Espacial",
    Milestone.GEOLOGIST: "Geólogo",
    Milestone.FARMER: "Granjero",
    # Amazonis Planitia
    Milestone.TERRAN: "Terrícola",
    Milestone.LANDSHAPER: "Modelador de Tierras",
    Milestone.MERCHANT: "Comerciante",
    Milestone.SPONSOR: "Patrocinador",
    Milestone.LOBBYIST: "Cabildero",
    # Venus Next
    Milestone.HOVERLORD: "Señor Flotante",
}

AWARD_TRANSLATIONS = {
    # Tharsis
    Award.LANDLORD: "Terrateniente",
    Award.BANKER: "Banquero",
    Award.SCIENTIST: "Científico",
    Award.THERMALIST: "Termista",
    Award.MINER: "Minero",
    # Hellas
    Award.CULTIVATOR: "Cultivador",
    Award.MAGNATE: "Magnate",
    Award.SPACE_BARON: "Barón Espacial",
    Award.EXCENTRIC: "Excéntrico",
    Award.CONTRACTOR: "Contratista",
    # Elysium
    Award.CELEBRITY: "Celebridad",
    Award.INDUSTRIALIST: "Industrial",
    Award.DESERT_SETTLER: "Colonizador del Desierto",
    Award.ESTATE_DEALER: "Agente Inmobiliario",
    Award.BENEFACTOR: "Benefactor",
    # Vastitas Borealis
    Award.TRAVELLER: "Viajero",
    Award.LANDSCAPER: "Paisajista",
    Award.HIGHLANDER: "Montañés",
    Award.PROMOTER: "Promotor",
    Award.BLACKSMITH: "Herrero",
    # Amazonis Planitia
    Award.COLLECTOR: "Coleccionista",
    Award.INNOVATOR: "Innovador",
    Award.CONSTRUCTOR: "Constructor",
    Award.MANUFACTURER: "Fabricante",
    Award.PHYSICIST: "Físico",
    # Venus Next
    Award.VENUPHILE: "Venusófilo",
}


def translate_milestone(milestone: Milestone) -> str:
    """Translate a Milestone enum to Spanish."""
    return MILESTONE_TRANSLATIONS.get(milestone, str(milestone))


def translate_award(award: Award) -> str:
    """Translate an Award enum to Spanish."""
    return AWARD_TRANSLATIONS.get(award, str(award))
