// Nombres en castellano de hitos y recompensas (decisión 3 del dueño). La API devuelve
// las claves del enum; la UI muestra siempre estas etiquetas. Espejo de
// docs/redesign/mockup/js/data/labels.js (un test compara los dos). Base: traducciones del PR #66; Utopia, Cimmeria y
// Venus agregadas en v2.0. Las marcadas en REVISAR no se pudieron verificar contra
// la edición local.
export const MILESTONE_LABELS: Record<string, string> = {
  // Tharsis
  Terraformer: 'Terraformador', Mayor: 'Alcalde', Gardener: 'Jardinero', Builder: 'Constructor', Planner: 'Planificador',
  // Elysium
  Generalist: 'Generalista', Specialist: 'Especialista', Ecologist: 'Ecólogo', Tycoon: 'Magnate', Legend: 'Leyenda',
  // Hellas
  Diversifier: 'Diversificador', Tactician: 'Táctico', 'Polar Explorer': 'Explorador Polar', Energizer: 'Energizador',
  'Rim Settler': 'Colonizador del Borde',
  // Vastitas Borealis (Spacecrafter es el nombre viejo del enum; ambos muestran lo mismo)
  Agronomist: 'Agrónomo', Engineer: 'Ingeniero', Spacefarer: 'Navegante Espacial', Spacecrafter: 'Navegante Espacial',
  Geologist: 'Geólogo', Farmer: 'Granjero',
  // Amazonis Planitia
  Terran: 'Terrícola', Landshaper: 'Modelador de Tierras', Merchant: 'Comerciante', Sponsor: 'Patrocinador', Lobbyist: 'Cabildero',
  // Utopia Planitia
  Manager: 'Gerente', Pioneer: 'Pionero', Trader: 'Mercader', Metallurgist: 'Metalúrgico', Researcher: 'Investigador',
  // Terra Cimmeria
  Planetologist: 'Planetólogo', Architect: 'Arquitecto', Coastguard: 'Guardacostas', Forester: 'Silvicultor', Fundraiser: 'Recaudador',
  // Venus Next (#33)
  Hoverlord: 'Ser Superior',
};

export const AWARD_LABELS: Record<string, string> = {
  // Tharsis
  Landlord: 'Terrateniente', Banker: 'Banquero', Scientist: 'Científico', Thermalist: 'Termista', Miner: 'Minero',
  // Hellas
  Cultivator: 'Cultivador', Magnate: 'Magnate', 'Space Baron': 'Barón Espacial', Excentric: 'Excéntrico', Contractor: 'Contratista',
  // Elysium
  Celebrity: 'Celebridad', Industrialist: 'Industrial', 'Desert Settler': 'Colonizador del Desierto',
  'Estate Dealer': 'Agente Inmobiliario', Benefactor: 'Benefactor',
  // Vastitas Borealis
  Traveller: 'Viajero', Landscaper: 'Paisajista', Highlander: 'Montañés', Promoter: 'Promotor', Blacksmith: 'Herrero',
  // Amazonis Planitia
  Collector: 'Coleccionista', Innovator: 'Innovador', Constructor: 'Constructor', Manufacturer: 'Fabricante', Physicist: 'Físico',
  // Utopia Planitia
  Suburbian: 'Suburbano', Investor: 'Inversor', Botanist: 'Botánico', Incorporator: 'Incorporador', Metropolist: 'Metropolitano',
  // Terra Cimmeria
  Electrician: 'Electricista', Founder: 'Fundador', Mogul: 'Potentado', Zoologist: 'Zoólogo', Forecaster: 'Pronosticador',
  // Venus Next (#33)
  Venuphile: 'Venúfilo',
};

// Etiquetas sin verificar contra la edición en castellano del juego.
export const REVISAR = [
  'Spacefarer', 'Manager', 'Pioneer', 'Trader', 'Metallurgist', 'Researcher', 'Planetologist', 'Architect', 'Coastguard',
  'Forester', 'Fundraiser', 'Suburbian', 'Investor', 'Botanist', 'Incorporator', 'Metropolist', 'Electrician', 'Founder',
  'Mogul', 'Zoologist', 'Forecaster',
];

export const milestoneLabel = (key: string): string => MILESTONE_LABELS[key] ?? key;
export const awardLabel = (key: string): string => AWARD_LABELS[key] ?? key;
