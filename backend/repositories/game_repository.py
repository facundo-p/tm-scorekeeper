from uuid import uuid4
from typing import Optional, List, Dict

from sqlalchemy.orm import Session

from db.session import get_session
from db.models import Game as GameORM, PlayerResult as PlayerResultORM, Award as AwardORM, Player as PlayerORM
from models.game import Game
from models.player_result import PlayerResult, PlayerEndStats
from models.award_result import AwardResult
from models.player_score import PlayerScore
from models.enums import (
    MapName,
    Expansion,
    Corporation,
    Milestone,
    Award,
)
from repositories.game_filters import GameFilter


class GamesRepository:
    def __init__(self, session_factory=get_session):
        self._session_factory = session_factory

    # helper transformers
    def _orm_to_domain(self, orm: GameORM) -> Game:
        # convert expansions array of enums
        expansions = [Expansion(e) for e in orm.expansions]
        player_results: List[PlayerResult] = []
        for pr in orm.player_results:
            scores = PlayerScore(
                terraform_rating=pr.terraform_rating,
                milestone_points=pr.milestone_points,
                milestones=[Milestone(m) for m in pr.milestones],
                award_points=pr.award_points,
                card_points=pr.card_points,
                card_resource_points=pr.card_resource_points,
                greenery_points=pr.greenery_points,
                city_points=pr.city_points,
                turmoil_points=pr.turmoil_points,
            )
            end_stats = PlayerEndStats(mc_total=pr.mc_total)
            player_results.append(
                PlayerResult(
                    player_id=pr.player_id,
                    corporation=Corporation(pr.corporation),
                    scores=scores,
                    end_stats=end_stats,
                )
            )
        awards: List[AwardResult] = []
        for a in orm.awards:
            awards.append(
                AwardResult(
                    award=Award(a.award_name),
                    opened_by=a.opened_by,
                    first_place=list(a.first_place),
                    second_place=list(a.second_place),
                )
            )

        return Game(
            game_id=orm.id,
            date=orm.date,
            map_name=MapName(orm.map_name),
            expansions=expansions,
            draft=orm.draft,
            generations=orm.generations,
            player_results=player_results,
            awards=awards,
        )

    def _domain_to_orm(self, game: Game, orm: Optional[GameORM] = None) -> GameORM:
        if orm is None:
            orm = GameORM()
        orm.id = game.id
        orm.date = game.date
        orm.map_name = game.map_name
        orm.expansions = [exp for exp in game.expansions]
        orm.draft = game.draft
        orm.generations = game.generations

        # clear existing results & awards if any
        orm.player_results = []
        for pr in game.player_results:
            # convert enum members to their name strings for PGEnum compatibility
            corp_value = pr.corporation.name if hasattr(pr.corporation, "name") else str(pr.corporation)
            orm_pr = PlayerResultORM(
                player_id=pr.player_id,
                corporation=corp_value,
                terraform_rating=pr.scores.terraform_rating,
                milestone_points=pr.scores.milestone_points,
                milestones=[m for m in pr.scores.milestones],
                award_points=pr.scores.award_points,
                card_points=pr.scores.card_points,
                card_resource_points=pr.scores.card_resource_points,
                greenery_points=pr.scores.greenery_points,
                city_points=pr.scores.city_points,
                turmoil_points=pr.scores.turmoil_points,
                mc_total=pr.end_stats.mc_total,
            )
            orm.player_results.append(orm_pr)

        orm.awards = []
        for a in game.awards:
            award_val = a.award.name if hasattr(a.award, "name") else str(a.award)
            orm_aw = AwardORM(
                award_name=award_val,
                opened_by=a.opened_by,
                first_place=list(a.first_place),
                second_place=list(a.second_place),
            )
            orm.awards.append(orm_aw)

        return orm

    def create(self, game: Game) -> str:
        if not game.id:
            game_id = str(uuid4())
            game.id = game_id
        else:
            game_id = game.id

        with self._session_factory() as session:
            orm = self._domain_to_orm(game)
            session.add(orm)
            session.commit()
        return game_id

    def list(self) -> Dict[str, Game]:
        with self._session_factory() as session:
            orm_games = session.query(GameORM).all()
            return {g.id: self._orm_to_domain(g) for g in orm_games}

    def update(self, game_id: str, game: Game) -> bool:
        with self._session_factory() as session:
            orm = session.get(GameORM, game_id)
            if not orm:
                return False
            game.id = game_id
            orm = self._domain_to_orm(game, orm)
            session.add(orm)
            session.commit()
            return True

    def delete(self, game_id: str) -> bool:
        with self._session_factory() as session:
            orm = session.get(GameORM, game_id)
            if not orm:
                return False
            session.delete(orm)
            session.commit()
            return True

    def get(self, game_id: str) -> Optional[Game]:
        with self._session_factory() as session:
            orm = session.get(GameORM, game_id)
            return self._orm_to_domain(orm) if orm else None

    def get_games_by_player(self, player_id: str) -> List[Game]:
        with self._session_factory() as session:
            orm_games = (
                session.query(GameORM)
                .join(GameORM.player_results)
                .filter(PlayerResultORM.player_id == player_id)
                .all()
            )
            return [self._orm_to_domain(g) for g in orm_games]

    def list_games(self, filters: Optional[GameFilter] = None) -> List[Game]:
        with self._session_factory() as session:
            query = session.query(GameORM)
            if filters and filters.game_ids is not None:
                query = query.filter(GameORM.id.in_(filters.game_ids))
            if filters and filters.date_from is not None:
                query = query.filter(GameORM.date >= filters.date_from)
            return [self._orm_to_domain(g) for g in query.all()]

    def list_games_from_date(self, start_date) -> List[Game]:
        return self.list_games(GameFilter(date_from=start_date))
