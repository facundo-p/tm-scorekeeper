// Conocimiento fijo del juego: port de docs/redesign/mockup/js/data/catalog.js. Las claves
// son los valores de los enums del backend (models/enums.py).

export interface MapInfo {
  name: string
  lat: number
  lon: number
  glyph: string
  since: string
  blurb: string
  milestones: string[]
  awards: string[]
}

export interface ExpansionInfo { id: string; label: string; short: string; glyph: string }
export interface CorpInfo { name: string; short: string; hue: number; exp: string }
export interface CategoryInfo { key: string; label: string; long: string; color: string; icon: string }
export interface TierMaterial { level: number; name: string; token: string }

export const MAPS: Record<string, MapInfo> = {
  Tharsis: {
    name: 'Tharsis', lat: 2, lon: -100, glyph: 'tharsis', since: '2024-01-01',
    blurb: 'La meseta volcánica: Olympus Mons y los tres Tharsis Montes.',
    milestones: ['Terraformer', 'Mayor', 'Gardener', 'Builder', 'Planner'],
    awards: ['Landlord', 'Banker', 'Scientist', 'Thermalist', 'Miner'],
  },
  Hellas: {
    name: 'Hellas', lat: -40, lon: 70, glyph: 'hellas', since: '2024-01-01',
    blurb: 'La cuenca de impacto más profunda del planeta.',
    milestones: ['Diversifier', 'Tactician', 'Polar Explorer', 'Energizer', 'Rim Settler'],
    awards: ['Cultivator', 'Magnate', 'Space Baron', 'Excentric', 'Contractor'],
  },
  Elysium: {
    name: 'Elysium', lat: 22, lon: 147, glyph: 'elysium', since: '2024-01-01',
    blurb: 'El segundo gran complejo volcánico, frente a Utopia.',
    milestones: ['Generalist', 'Specialist', 'Ecologist', 'Tycoon', 'Legend'],
    awards: ['Celebrity', 'Industrialist', 'Desert Settler', 'Estate Dealer', 'Benefactor'],
  },
  'Vastitas Borealis': {
    name: 'Vastitas Borealis', lat: 64, lon: -15, glyph: 'borealis', since: '2025-06-01',
    blurb: 'Las llanuras del norte, alrededor del casquete polar.',
    milestones: ['Agronomist', 'Engineer', 'Spacefarer', 'Geologist', 'Farmer'],
    awards: ['Traveller', 'Landscaper', 'Highlander', 'Promoter', 'Blacksmith'],
  },
  'Amazonis Planitia': {
    name: 'Amazonis Planitia', lat: 18, lon: -158, glyph: 'amazonis', since: '2025-06-01',
    blurb: 'La llanura más lisa de Marte, al oeste de Olympus Mons.',
    milestones: ['Terran', 'Landshaper', 'Merchant', 'Sponsor', 'Lobbyist'],
    awards: ['Collector', 'Innovator', 'Constructor', 'Manufacturer', 'Physicist'],
  },
  'Utopia Planitia': {
    name: 'Utopia Planitia', lat: 46, lon: 118, glyph: 'utopia', since: '2026-05-01',
    blurb: 'La gran cuenca del norte donde aterrizó el Viking 2.',
    milestones: ['Manager', 'Pioneer', 'Trader', 'Metallurgist', 'Researcher'],
    awards: ['Suburbian', 'Investor', 'Botanist', 'Incorporator', 'Metropolist'],
  },
  'Terra Cimmeria': {
    name: 'Terra Cimmeria', lat: -34, lon: 145, glyph: 'cimmeria', since: '2026-05-01',
    blurb: 'Tierras altas craterizadas del hemisferio sur.',
    milestones: ['Planetologist', 'Architect', 'Coastguard', 'Forester', 'Fundraiser'],
    awards: ['Electrician', 'Founder', 'Mogul', 'Zoologist', 'Forecaster'],
  },
};

export const MAP_ORDER: string[] = ['Tharsis', 'Hellas', 'Elysium', 'Utopia Planitia', 'Terra Cimmeria', 'Vastitas Borealis', 'Amazonis Planitia'];

export const EXPANSIONS: Record<string, ExpansionInfo> = {
  Prelude: { id: 'Prelude', label: 'Prelude', short: 'P', glyph: 'prelude' },
  Colonies: { id: 'Colonies', label: 'Colonies', short: 'C', glyph: 'colonies' },
  Turmoil: { id: 'Turmoil', label: 'Turmoil', short: 'T', glyph: 'turmoil' },
  'Venus next': { id: 'Venus next', label: 'Venus Next', short: 'V', glyph: 'venus' },
};

export const EXPANSION_MILESTONES: Record<string, string[]> = { 'Venus next': ['Hoverlord'] };
export const EXPANSION_AWARDS: Record<string, string[]> = { 'Venus next': ['Venuphile'] };

const corp = (name: string, short: string, hue: number, exp: string): CorpInfo => ({ name, short, hue, exp });
export const CORPS: CorpInfo[] = [
  corp('Credicor', 'CR', 280, 'base'), corp('Ecoline', 'EC', 115, 'base'), corp('Helion', 'HE', 42, 'base'),
  corp('Producciones Interplanetarias', 'PI', 352, 'base'), corp('Inventrix', 'IN', 190, 'base'),
  corp('Mining Guild', 'MG', 25, 'base'), corp('Phobolog', 'PH', 220, 'base'), corp('Saturn Systems', 'SS', 48, 'base'),
  corp('Tharsis Republic', 'TR', 12, 'base'), corp('Thorgate', 'TH', 265, 'base'),
  corp('United Nations Mars Initiative (UNMI)', 'UN', 205, 'base'), corp('Teractor', 'TE', 30, 'base'),
  corp('Point Luna', 'PL', 230, 'Prelude'), corp('Robinson Industries', 'RI', 210, 'Prelude'),
  corp('Valley Trust', 'VT', 175, 'Prelude'), corp('Vitor', 'VI', 330, 'Prelude'),
  corp('Arcadian Communities', 'AC', 95, 'Prelude'), corp('Nirgal Enterprises', 'NE', 160, 'Prelude'),
  corp('Ecotec', 'ET', 130, 'Prelude'), corp('Palladin Shipping', 'PS', 200, 'Prelude'), corp('Spire', 'SP', 250, 'Prelude'),
  corp('Aphrodite', 'AP', 45, 'Venus next'), corp('Celestic', 'CE', 190, 'Venus next'), corp('Manutech', 'MA', 20, 'Venus next'),
  corp('Morning Star Inc.', 'MS', 50, 'Venus next'), corp('Viron', 'VR', 285, 'Venus next'),
  corp('Aridor', 'AR', 35, 'Colonies'), corp('Polyphemos', 'PO', 225, 'Colonies'), corp('Poseidon', 'PD', 205, 'Colonies'),
  corp('Stormcraft Incorporated', 'ST', 215, 'Colonies'), corp('Terralabs Research', 'TL', 180, 'Colonies'), corp('Arklight', 'AK', 105, 'Colonies'),
  corp('Septem Tribus', 'S7', 355, 'Turmoil'), corp('Utopia Invest', 'UI', 45, 'Turmoil'), corp('Pristar', 'PR', 340, 'Turmoil'),
  corp('Hoteles Lagoazul', 'HL', 195, 'Turmoil'), corp('Mons Insurance', 'MI', 225, 'Turmoil'), corp('Terralabs Investigation', 'TI', 185, 'Turmoil'),
  corp('Cheung Shing Mars', 'CS', 5, 'Prelude'), corp('Factorum', 'FA', 30, 'Prelude'), corp('Recyclon', 'RE', 120, 'Prelude'),
  corp('Sagitta', 'SA', 270, 'Prelude'), corp('Novel Corporation', 'NO', 60, 'base'), corp('Philares', 'PH', 150, 'Prelude'),
];
export const CORP_BY_NAME: Record<string, CorpInfo> = Object.fromEntries(CORPS.map((c) => [c.name, c]));
export const corpLabel = (name: string): string => (name === 'United Nations Mars Initiative (UNMI)' ? 'UNMI' : name);

export const CATEGORIES: CategoryInfo[] = [
  { key: 'terraform_rating', label: 'TR', long: 'Terraform Rating', color: 'var(--cat-tr)', icon: 'tr' },
  { key: 'award_points', label: 'Recompensas', long: 'Recompensas', color: 'var(--cat-awards)', icon: 'award' },
  { key: 'milestone_points', label: 'Hitos', long: 'Hitos', color: 'var(--cat-milestones)', icon: 'milestone' },
  { key: 'card_resource_points', label: 'Recursos', long: 'Recursos de cartas', color: 'var(--cat-resources)', icon: 'resource' },
  { key: 'card_points', label: 'Cartas', long: 'Puntos de cartas', color: 'var(--cat-cards)', icon: 'card' },
  { key: 'greenery_points', label: 'Vegetación', long: 'Vegetación', color: 'var(--cat-greenery)', icon: 'greenery' },
  { key: 'city_points', label: 'Ciudades', long: 'Ciudades', color: 'var(--cat-cities)', icon: 'city' },
  { key: 'turmoil_points', label: 'Turmoil', long: 'Turmoil', color: 'var(--cat-turmoil)', icon: 'turmoil' },
];

// Íconos de los récords y glifos de los logros por código (el resto viene de la API).
export const RECORD_ICON: Record<string, string> = {
  highest_single_game_score: 'trophy',
  highest_terraform_rating: 'tr',
  highest_card_points: 'card',
  highest_card_resource_points: 'resource',
  highest_greenery_points: 'greenery',
  highest_city_points: 'city',
  highest_turmoil_points: 'turmoil',
  most_games_played: 'generation',
  most_games_won: 'crown',
  biggest_margin: 'margin',
  closest_win: 'photo',
  points_per_generation: 'engine',
  fastest_win: 'blitz',
  highest_elo: 'peak',
  longest_streak: 'flame',
  richest_finish: 'mc',
}

export const ACHIEVEMENT_GLYPH: Record<string, string> = {
  high_score: 'trophy',
  games_played: 'generation',
  games_won: 'crown',
  win_streak: 'flame',
  greenery_tiles: 'greenery',
  all_maps: 'maps',
  stolen_awards: 'steal',
  card_points: 'card',
  milestone_master: 'milestone',
  no_milestone_win: 'lone',
  award_master: 'award',
  no_award_win: 'eye',
  corp_collector: 'corp',
  photo_finish: 'photo',
  blitz: 'blitz',
  giant_killer: 'giant',
  full_table: 'fullTable',
  city_planner: 'city',
}

export const TIER_MATERIALS: TierMaterial[] = [
  { level: 1, name: 'Acero', token: 'steel' },
  { level: 2, name: 'Titanio', token: 'titanium' },
  { level: 3, name: 'Oro M€', token: 'gold' },
  { level: 4, name: 'Plasma', token: 'plasma' },
  { level: 5, name: 'Gaia', token: 'gaia' },
];

export const PARAMS: Record<string, { min: number; max: number; step: number }> = {
  temperature: { min: -30, max: 8, step: 2 },
  oxygen: { min: 0, max: 14, step: 1 },
  oceans: { min: 0, max: 9, step: 1 },
};

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
