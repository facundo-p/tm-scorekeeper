// Static game knowledge: mirrors backend enums (models/enums.py), record calculators
// and achievement definitions. The 7 records and 6 achievements added by the
// redesign are official since v2.0 (owner's decision 2).

export const MAPS = {
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

export const MAP_ORDER = ['Tharsis', 'Hellas', 'Elysium', 'Utopia Planitia', 'Terra Cimmeria', 'Vastitas Borealis', 'Amazonis Planitia'];

export const REGIONS = Object.fromEntries(Object.values(MAPS).map((m) => [m.name, { lat: m.lat, lon: m.lon }]));

export const EXPANSIONS = {
  Prelude: { id: 'Prelude', label: 'Prelude', short: 'P', glyph: 'prelude' },
  Colonies: { id: 'Colonies', label: 'Colonies', short: 'C', glyph: 'colonies' },
  Turmoil: { id: 'Turmoil', label: 'Turmoil', short: 'T', glyph: 'turmoil' },
  'Venus next': { id: 'Venus next', label: 'Venus Next', short: 'V', glyph: 'venus' },
};

export const EXPANSION_MILESTONES = { 'Venus next': ['Hoverlord'] };
export const EXPANSION_AWARDS = { 'Venus next': ['Venuphile'] };

const corp = (name, short, hue, exp) => ({ name, short, hue, exp });
export const CORPS = [
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
export const CORP_BY_NAME = Object.fromEntries(CORPS.map((c) => [c.name, c]));
export const corpLabel = (name) => (name === 'United Nations Mars Initiative (UNMI)' ? 'UNMI' : name);

// Score categories in the validated colour order (see css/tokens.css).
export const CATEGORIES = [
  { key: 'terraform_rating', label: 'TR', long: 'Terraform Rating', color: 'var(--cat-tr)', icon: 'tr' },
  { key: 'award_points', label: 'Recompensas', long: 'Recompensas', color: 'var(--cat-awards)', icon: 'award' },
  { key: 'milestone_points', label: 'Hitos', long: 'Hitos', color: 'var(--cat-milestones)', icon: 'milestone' },
  { key: 'card_resource_points', label: 'Recursos', long: 'Recursos de cartas', color: 'var(--cat-resources)', icon: 'resource' },
  { key: 'card_points', label: 'Cartas', long: 'Puntos de cartas', color: 'var(--cat-cards)', icon: 'card' },
  { key: 'greenery_points', label: 'Vegetación', long: 'Vegetación', color: 'var(--cat-greenery)', icon: 'greenery' },
  { key: 'city_points', label: 'Ciudades', long: 'Ciudades', color: 'var(--cat-cities)', icon: 'city' },
  { key: 'turmoil_points', label: 'Turmoil', long: 'Turmoil', color: 'var(--cat-turmoil)', icon: 'turmoil' },
];

export const PLAYERS_SEED = [
  { id: 'p-facu', name: 'Facu', color: 'rojo', since: '2025-03-08', skill: 0.64, style: { card_points: 1.5, card_resource_points: 1.1 } },
  { id: 'p-nico', name: 'Nico', color: 'azul', since: '2025-03-08', skill: 0.6, style: { city_points: 1.55, award_points: 1.1 } },
  { id: 'p-juli', name: 'Juli', color: 'verde', since: '2025-03-08', skill: 0.58, style: { greenery_points: 1.6, terraform_rating: 1.05 } },
  { id: 'p-caro', name: 'Caro', color: 'amarillo', since: '2025-03-08', skill: 0.62, style: { terraform_rating: 1.18, milestone_points: 1.2 } },
  { id: 'p-tomi', name: 'Tomi', color: 'violeta', since: '2025-04-12', skill: 0.5, style: { award_points: 1.45, milestone_points: 1.3 } },
  { id: 'p-meli', name: 'Meli', color: 'rosa', since: '2025-05-03', skill: 0.52, style: { card_resource_points: 1.8 } },
  { id: 'p-santi', name: 'Santi', color: 'naranja', since: '2025-06-14', skill: 0.47, style: {} },
  { id: 'p-lu', name: 'Lu', color: 'blanco', since: '2025-09-06', skill: 0.5, style: { turmoil_points: 1.8, city_points: 1.1 } },
  { id: 'p-gonza', name: 'Gonza', color: 'negro', since: '2025-11-15', skill: 0.55, style: { card_points: 1.2, greenery_points: 1.15 } },
  { id: 'p-pato', name: 'Pato', color: 'gris', since: '2025-03-22', skill: 0.44, style: {}, inactiveFrom: '2025-10-01' },
];

export const RECORDS = [
  { code: 'highest_single_game_score', title: 'Emperador de Marte', description: 'Puntaje más alto en una partida', icon: 'trophy', unit: 'pts', scope: 'game' },
  { code: 'highest_terraform_rating', title: 'Arquitecto climático', description: 'TR más alto en una partida', icon: 'tr', unit: 'TR', scope: 'game' },
  { code: 'highest_card_points', title: 'Magnate de proyectos', description: 'Más puntos de cartas en una partida', icon: 'card', unit: 'pts', scope: 'game' },
  { code: 'highest_card_resource_points', title: 'Barón de los recursos', description: 'Más puntos por recursos de cartas en una partida', icon: 'resource', unit: 'pts', scope: 'game' },
  { code: 'highest_greenery_points', title: 'Rey de los bosques', description: 'Más puntos de vegetación en una partida', icon: 'greenery', unit: 'pts', scope: 'game' },
  { code: 'highest_city_points', title: 'Urbanista supremo', description: 'Más puntos de ciudades en una partida', icon: 'city', unit: 'pts', scope: 'game' },
  { code: 'highest_turmoil_points', title: 'Maestro de la política', description: 'Más puntos de Turmoil en una partida', icon: 'turmoil', unit: 'pts', scope: 'game' },
  { code: 'most_games_played', title: 'Colono persistente', description: 'Más partidas jugadas', icon: 'generation', unit: 'partidas', scope: 'career' },
  { code: 'most_games_won', title: 'Estratega extraordinario', description: 'Más partidas ganadas', icon: 'crown', unit: 'victorias', scope: 'career' },
  { code: 'biggest_margin', title: 'Aplanadora', description: 'Mayor diferencia entre el ganador y el segundo', icon: 'margin', unit: 'pts', scope: 'game' },
  { code: 'closest_win', title: 'Por un pelo', description: 'Victoria más ajustada (menor diferencia con el segundo)', icon: 'photo', unit: 'pts', scope: 'game', lowerIsBetter: true },
  { code: 'points_per_generation', title: 'Motor perfecto', description: 'Más puntos por generación en una partida', icon: 'engine', unit: 'pts/gen', scope: 'game' },
  { code: 'fastest_win', title: 'Blitz', description: 'Victoria en la partida con menos generaciones', icon: 'blitz', unit: 'gen', scope: 'game', lowerIsBetter: true },
  { code: 'highest_elo', title: 'Cima del Consejo', description: 'ELO más alto alcanzado', icon: 'peak', unit: 'ELO', scope: 'career' },
  { code: 'longest_streak', title: 'Imparable', description: 'Racha de victorias consecutivas más larga', icon: 'flame', unit: 'seguidas', scope: 'career' },
  { code: 'richest_finish', title: 'Tesorería', description: 'Más M€ al terminar una partida', icon: 'mc', unit: 'M€', scope: 'game' },
];

const tiers = (list) => list.map(([threshold, title], i) => ({ level: i + 1, threshold, title }));
export const ACHIEVEMENTS = [
  { code: 'high_score', description: 'Alcanzar X puntos en una partida', glyph: 'trophy', kind: 'max', metric: 'score',
    flavor: 'Los números no mienten. Los rivales, a veces.',
    tiers: tiers([[50, 'Colono'], [75, 'Joven Promesa'], [100, 'Gran Terraformador'], [125, 'Leyenda de Marte'], [150, 'Emperador de Marte']]) },
  { code: 'games_played', description: 'Jugar partidas de Terraforming Mars', glyph: 'generation', kind: 'sum', metric: 'games',
    flavor: 'Una generación más. Siempre una generación más.',
    tiers: tiers([[5, 'Novato'], [10, 'Habitué'], [25, 'Veterano'], [50, 'Terraformador Nato'], [100, 'Adicto a Marte']]) },
  { code: 'games_won', description: 'Ganar partidas de Terraforming Mars', glyph: 'crown', kind: 'sum', metric: 'wins',
    flavor: 'El Comité recuerda a quien entrega resultados.',
    tiers: tiers([[3, 'Primera Victoria'], [5, 'Conquistador'], [10, 'Dominador'], [20, 'Invicto'], [50, 'Señor de Marte']]) },
  { code: 'win_streak', description: 'Ganar partidas consecutivas', glyph: 'flame', kind: 'max', metric: 'streak',
    flavor: 'El calor también se acumula.',
    tiers: tiers([[2, 'Racha'], [3, 'Imparable'], [5, 'Invencible']]) },
  { code: 'greenery_tiles', description: 'Sumar puntos de vegetación a lo largo de todas las partidas', glyph: 'greenery', kind: 'sum', metric: 'greenery',
    flavor: 'Cada loseta verde es un poco más de oxígeno para todos.',
    tiers: tiers([[25, 'Jardinero Marciano'], [50, 'Ecologista'], [100, 'Guardián del Bosque'], [200, 'Maestro Botánico'], [350, 'Elfo Marciano']]) },
  { code: 'all_maps', description: 'Jugar en distintos mapas de Marte', glyph: 'maps', kind: 'sum', metric: 'maps',
    flavor: 'Del polo norte a la cuenca de Hellas.',
    tiers: tiers([[2, 'Explorador'], [3, 'Cartógrafo'], [5, 'Conquistador de Marte'], [7, 'Señor de Marte']]) },
  { code: 'stolen_awards', description: 'Quedar 1.º en solitario en recompensas que financió otro, en una misma partida', glyph: 'steal', kind: 'max', metric: 'stolen',
    flavor: 'Gracias por los 8 M€.',
    tiers: tiers([[1, 'Oportunista'], [2, 'Ladrón'], [3, 'Gran Estafador']]) },
  { code: 'card_points', description: 'Alcanzar X puntos de cartas en una partida', glyph: 'card', kind: 'max', metric: 'cards',
    flavor: 'Proyecto aprobado. Y otro. Y otro más.',
    tiers: tiers([[10, 'Apostador'], [20, 'Inversor'], [30, 'Magnate'], [40, 'Cerebro Corporativo'], [50, 'Elon Musk']]) },
  { code: 'milestone_master', description: 'Ganar una partida habiendo reclamado los 3 hitos', glyph: 'milestone', kind: 'flag', metric: 'allMilestonesWin',
    flavor: 'Nadie más llegó a tiempo.', tiers: tiers([[1, 'Maestro de Hitos']]) },
  { code: 'no_milestone_win', description: 'Ganar una partida sin haber reclamado ningún hito', glyph: 'lone', kind: 'flag', metric: 'noMilestoneWin',
    flavor: 'Sin banderas, sin ceremonias.', tiers: tiers([[1, 'Lobo Solitario']]) },
  { code: 'award_master', description: 'Ganar una partida quedando 1.º en las 3 recompensas', glyph: 'award', kind: 'flag', metric: 'allAwardsWin',
    flavor: 'Tres podios, un solo nombre.', tiers: tiers([[1, 'Rey de las Recompensas']]) },
  { code: 'no_award_win', description: 'Ganar una partida sin quedar 1.º en ninguna recompensa', glyph: 'eye', kind: 'flag', metric: 'noAwardWin',
    flavor: 'Nadie lo vio venir.', tiers: tiers([[1, 'Incomprendido']]) },
  { code: 'corp_collector', description: 'Jugar con corporaciones distintas', glyph: 'corp', kind: 'sum', metric: 'corps',
    flavor: 'Cada directorio tiene su manera de ver Marte.',
    tiers: tiers([[5, 'Consultor'], [10, 'Accionista'], [20, 'Holding'], [30, 'Conglomerado']]) },
  { code: 'photo_finish', description: 'Ganar por 2 puntos o menos', glyph: 'photo', kind: 'flag', metric: 'photoFinish',
    flavor: 'Hubo que contar dos veces.', tiers: tiers([[1, 'Fotofinish']]) },
  { code: 'blitz', description: 'Ganar una partida de 9 generaciones o menos', glyph: 'blitz', kind: 'flag', metric: 'blitz',
    flavor: 'El oxígeno subió más rápido de lo previsto.', tiers: tiers([[1, 'Blitz']]) },
  { code: 'giant_killer', description: 'Ganar una partida en la que jugaba el n.º 1 del ranking', glyph: 'giant', kind: 'sum', metric: 'giantKills',
    flavor: 'Hasta los volcanes más altos tienen una ladera.',
    tiers: tiers([[1, 'Retador'], [3, 'Matagigantes'], [6, 'Verdugo del Consejo']]) },
  { code: 'full_table', description: 'Ganar una partida de 5 jugadores', glyph: 'fullTable', kind: 'flag', metric: 'fullTableWin',
    flavor: 'Cinco corporaciones, un solo planeta.', tiers: tiers([[1, 'Mesa llena']]) },
  { code: 'city_planner', description: 'Alcanzar X puntos de ciudades en una partida', glyph: 'city', kind: 'max', metric: 'cities',
    flavor: 'Domos, calles, luces en la noche marciana.',
    tiers: tiers([[10, 'Loteador'], [15, 'Urbanista'], [20, 'Metrópolis'], [25, 'Megalópolis']]) },
];

// Tier materials, borrowed from the game's own resources.
export const TIER_MATERIALS = [
  { level: 1, name: 'Acero', token: 'steel' },
  { level: 2, name: 'Titanio', token: 'titanium' },
  { level: 3, name: 'Oro M€', token: 'gold' },
  { level: 4, name: 'Plasma', token: 'plasma' },
  { level: 5, name: 'Gaia', token: 'gaia' },
];

export const PARAMS = {
  temperature: { min: -30, max: 8, step: 2 },
  oxygen: { min: 0, max: 14, step: 1 },
  oceans: { min: 0, max: 9, step: 1 },
};

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
