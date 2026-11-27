"""Hitos y recompensas de cada mapa y expansión (D-51).

Espejo del catálogo del frontend (frontend/src/domain/catalog.ts) y del mockup
(docs/redesign/mockup/js/data/catalog.js). Un test compara las tablas de mapas con las del frontend.
"""
from models.enums import Award, Expansion, MapName, Milestone


MAP_MILESTONES: dict[MapName, tuple[Milestone, ...]] = {
    MapName.THARSIS: (Milestone.TERRAFORMER, Milestone.MAYOR, Milestone.GARDENER, Milestone.BUILDER, Milestone.PLANNER,),
    MapName.HELLAS: (Milestone.DIVERSIFIER, Milestone.TACTICIAN, Milestone.POLAR_EXPLORER, Milestone.ENERGIZER, Milestone.RIM_SETTLER,),
    MapName.ELYSIUM: (Milestone.GENERALIST, Milestone.SPECIALIST, Milestone.ECOLOGIST, Milestone.TYCOON, Milestone.LEGEND,),
    MapName.BOREALIS: (Milestone.AGRONOMIST, Milestone.ENGINEER, Milestone.SPACEFARER, Milestone.GEOLOGIST, Milestone.FARMER,),
    MapName.AMAZONIS: (Milestone.TERRAN, Milestone.LANDSHAPER, Milestone.MERCHANT, Milestone.SPONSOR, Milestone.LOBBYIST,),
    MapName.UTOPIA: (Milestone.MANAGER, Milestone.PIONEER, Milestone.TRADER, Milestone.METALLURGIST, Milestone.RESEARCHER,),
    MapName.CIMMERIA: (Milestone.PLANETOLOGIST, Milestone.ARCHITECT, Milestone.COASTGUARD, Milestone.FORESTER, Milestone.FUNDRAISER,),
}

MAP_AWARDS: dict[MapName, tuple[Award, ...]] = {
    MapName.THARSIS: (Award.LANDLORD, Award.BANKER, Award.SCIENTIST, Award.THERMALIST, Award.MINER,),
    MapName.HELLAS: (Award.CULTIVATOR, Award.MAGNATE, Award.SPACE_BARON, Award.EXCENTRIC, Award.CONTRACTOR,),
    MapName.ELYSIUM: (Award.CELEBRITY, Award.INDUSTRIALIST, Award.DESERT_SETTLER, Award.ESTATE_DEALER, Award.BENEFACTOR,),
    MapName.BOREALIS: (Award.TRAVELLER, Award.LANDSCAPER, Award.HIGHLANDER, Award.PROMOTER, Award.BLACKSMITH,),
    MapName.AMAZONIS: (Award.COLLECTOR, Award.INNOVATOR, Award.CONSTRUCTOR, Award.MANUFACTURER, Award.PHYSICIST,),
    MapName.UTOPIA: (Award.SUBURBIAN, Award.INVESTOR, Award.BOTANIST, Award.INCORPORATOR, Award.METROPOLIST,),
    MapName.CIMMERIA: (Award.ELECTRICIAN, Award.FOUNDER, Award.MOGUL, Award.ZOOLOGIST, Award.FORECASTER,),
}

EXPANSION_MILESTONES: dict[Expansion, tuple[Milestone, ...]] = {Expansion.VENUS_NEXT: (Milestone.HOVERLORD,)}
EXPANSION_AWARDS: dict[Expansion, tuple[Award, ...]] = {Expansion.VENUS_NEXT: (Award.VENUPHILE,)}


def allowed_milestones(map_name: MapName, expansions: list[Expansion]) -> set[Milestone]:
    extra = (m for e in expansions for m in EXPANSION_MILESTONES.get(e, ()))
    return {*MAP_MILESTONES[map_name], *extra}


def allowed_awards(map_name: MapName, expansions: list[Expansion]) -> set[Award]:
    extra = (a for e in expansions for a in EXPANSION_AWARDS.get(e, ()))
    return {*MAP_AWARDS[map_name], *extra}
