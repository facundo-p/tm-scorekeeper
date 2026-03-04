import { MapName, Milestone, Award } from './enums'

export const MAX_MILESTONES = 3
export const MAX_AWARDS = 3
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 5
export const MILESTONE_POINTS = 5
export const AWARD_FIRST_POINTS = 5
export const AWARD_SECOND_POINTS = 2

export const MAP_MILESTONES: Record<MapName, Milestone[]> = {
  [MapName.THARSIS]: [
    Milestone.TERRAFORMER,
    Milestone.MAYOR,
    Milestone.GARDENER,
    Milestone.BUILDER,
    Milestone.PLANNER,
  ],
  [MapName.ELYSIUM]: [
    Milestone.GENERALIST,
    Milestone.SPECIALIST,
    Milestone.ECOLOGIST,
    Milestone.TYCOON,
    Milestone.LEGEND,
  ],
  [MapName.HELLAS]: [
    Milestone.DIVERSIFIER,
    Milestone.TACTICIAN,
    Milestone.POLAR_EXPLORER,
    Milestone.ENERGIZER,
    Milestone.RIM_SETTLER,
  ],
  [MapName.BOREALIS]: [
    Milestone.AGRONOMIST,
    Milestone.ENGINEER,
    Milestone.SPACECRAFTER,
    Milestone.GEOLOGIST,
    Milestone.FARMER,
  ],
  [MapName.AMAZONIS]: [
    Milestone.TERRAN,
    Milestone.LANDSHAPER,
    Milestone.MERCHANT,
    Milestone.SPONSOR,
    Milestone.LOBBYIST,
  ],
}

export const MAP_AWARDS: Record<MapName, Award[]> = {
  [MapName.THARSIS]: [
    Award.TERRAFORMER,
    Award.MAYOR,
    Award.GARDENER,
    Award.BUILDER,
    Award.PLANNER,
  ],
  [MapName.HELLAS]: [
    Award.CULTIVATOR,
    Award.MAGNATE,
    Award.SPACE_BARON,
    Award.EXCENTRIC,
    Award.CONTRACTOR,
  ],
  [MapName.ELYSIUM]: [
    Award.CELEBRITY,
    Award.INDUSTRIALIST,
    Award.DESERT_SETTLER,
    Award.ESTATE_DEALER,
    Award.BENEFACTOR,
  ],
  [MapName.BOREALIS]: [
    Award.TRAVELLER,
    Award.LANDSCAPER,
    Award.HIGHLANDER,
    Award.PROMOTER,
    Award.BLACKSMITH,
  ],
  [MapName.AMAZONIS]: [
    Award.COLLECTOR,
    Award.INNOVATOR,
    Award.CONSTRUCTOR,
    Award.MANUFACTURER,
    Award.PHYSICIST,
  ],
}
