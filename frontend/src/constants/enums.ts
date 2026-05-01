// Mirror of backend models/enums.py
// Values must match backend string values exactly.

export enum MapName {
  HELLAS = 'Hellas',
  THARSIS = 'Tharsis',
  ELYSIUM = 'Elysium',
  BOREALIS = 'Vastitas Borealis',
  AMAZONIS = 'Amazonis Planitia',
}

export enum Expansion {
  PRELUDE = 'Prelude',
  COLONIES = 'Colonies',
  TURMOIL = 'Turmoil',
  VENUS_NEXT = 'Venus next',
}

export enum Milestone {
  // Tharsis
  TERRAFORMER = 'Terraformer',
  MAYOR = 'Mayor',
  GARDENER = 'Gardener',
  BUILDER = 'Builder',
  PLANNER = 'Planner',
  // Elysium
  GENERALIST = 'Generalist',
  SPECIALIST = 'Specialist',
  ECOLOGIST = 'Ecologist',
  TYCOON = 'Tycoon',
  LEGEND = 'Legend',
  // Hellas
  DIVERSIFIER = 'Diversifier',
  TACTICIAN = 'Tactician',
  POLAR_EXPLORER = 'Polar Explorer',
  ENERGIZER = 'Energizer',
  RIM_SETTLER = 'Rim Settler',
  // Vastitas Borealis
  AGRONOMIST = 'Agronomist',
  ENGINEER = 'Engineer',
  SPACECRAFTER = 'Spacecrafter',
  GEOLOGIST = 'Geologist',
  FARMER = 'Farmer',
  // Amazonis Planitia
  TERRAN = 'Terran',
  LANDSHAPER = 'Landshaper',
  MERCHANT = 'Merchant',
  SPONSOR = 'Sponsor',
  LOBBYIST = 'Lobbyist',
  // Venus Next
  HOVERLORD = 'Hoverlord',
}

export enum Award {
  // Tharsis (note: backend uses same string values as Tharsis milestones)
  TERRATENIENTE = 'Terrateniente',
  BANQUERO = 'Banquero',
  CIENTIFICO = 'Científico',
  TERMALISTA = 'Termalista',
  MINERO = 'Minero',
  // Hellas
  CULTIVATOR = 'Cultivator',
  MAGNATE = 'Magnate',
  SPACE_BARON = 'Space Baron',
  EXCENTRIC = 'Excentric',
  CONTRACTOR = 'Contractor',
  // Elysium
  CELEBRITY = 'Celebrity',
  INDUSTRIALIST = 'Industrialist',
  DESERT_SETTLER = 'Desert Settler',
  ESTATE_DEALER = 'Estate Dealer',
  BENEFACTOR = 'Benefactor',
  // Vastitas Borealis
  TRAVELLER = 'Traveller',
  LANDSCAPER = 'Landscaper',
  HIGHLANDER = 'Highlander',
  PROMOTER = 'Promoter',
  BLACKSMITH = 'Blacksmith',
  // Amazonis Planitia
  COLLECTOR = 'Collector',
  INNOVATOR = 'Innovator',
  CONSTRUCTOR = 'Constructor',
  MANUFACTURER = 'Manufacturer',
  PHYSICIST = 'Physicist',
  // Venus Next
  VENUPHILE = 'Venuphile',
}

export enum Corporation {
  // Base Game
  CREDICOR = 'Credicor',
  ECOLINE = 'Ecoline',
  HELION = 'Helion',
  INTERPLANETARY_CINEMATICS = 'Producciones Interplanetarias',
  INVENTRIX = 'Inventrix',
  MINING_GUILD = 'Mining Guild',
  PHOBOLOG = 'Phobolog',
  SATURN_SYSTEMS = 'Saturn Systems',
  THARSIS_REPUBLIC = 'Tharsis Republic',
  THORGATE = 'Thorgate',
  UNMI = 'United Nations Mars Initiative (UNMI)',
  TERACTOR = 'Teractor',
  // Prelude
  POINT_LUNA = 'Point Luna',
  ROBINSON_INDUSTRIES = 'Robinson Industries',
  VALLEY_TRUST = 'Valley Trust',
  VITOR = 'Vitor',
  ARCADIAN_COMMUNITIES = 'Arcadian Communities',
  NIRGAL = 'Nirgal Enterprises',
  ECOTEC = 'Ecotec',
  PALLADIN_SHIPPING = 'Palladin Shipping',
  SPIRE = 'Spire',
  // Venus Next
  APHRODITE = 'Aphrodite',
  CELESTIC = 'Celestic',
  MANUTECH = 'Manutech',
  MORNING_STAR_INC = 'Morning Star Inc.',
  VIRON = 'Viron',
  // Colonies
  ARIDOR = 'Aridor',
  POLYPHEMOS = 'Polyphemos',
  POSEIDON = 'Poseidon',
  STORMCRAFT = 'Stormcraft Incorporated',
  TERRALABS_RESEARCH = 'Terralabs Research',
  ARKLIGHT = 'Arklight',
  // Turmoil
  SEPTEM_TRIBUS = 'Septem Tribus',
  UTOPIA_INVEST = 'Utopia Invest',
  PRISTAR = 'Pristar',
  LAKEFRONT_RESORTS = 'Hoteles Lagoazul',
  MONS_INSURANCE = 'Mons Insurance',
  TERRALABS = 'Terralabs Investigation',
  // Prelude 2
  CHEUNG_SHING_MARS = 'Cheung Shing Mars',
  FACTORUM = 'Factorum',
  RECYCLON = 'Recyclon',
  SAGITTA = 'Sagitta',
  NOVEL = 'Novel Corporation',
  PHILARES = 'Philares',
}
