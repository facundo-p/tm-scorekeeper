from sqlalchemy import (
    Column,
    Date,
    Integer,
    String,
    Boolean,
    ForeignKey,
    Table,
    Enum as PgEnum,
    ARRAY,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, declarative_base
from models.enums import (
    MapName,
    Expansion,
    Corporation,
    Milestone,
    Award,
)

Base = declarative_base()


# define Postgres enum types based on existing Python enums
mapname_enum = PgEnum(MapName, name="mapname")
expansion_enum = PgEnum(Expansion, name="expansion")
corporation_enum = PgEnum(Corporation, name="corporation")
milestone_enum = PgEnum(Milestone, name="milestone")
award_enum = PgEnum(Award, name="award")


class Player(Base):
    __tablename__ = "players"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    elo = Column(Integer, nullable=False, default=1000)

    results = relationship("PlayerResult", back_populates="player")
    opened_awards = relationship("Award", back_populates="opened_by_player")
    achievements = relationship("PlayerAchievement", back_populates="player", cascade="all, delete-orphan")
    elo_history = relationship("PlayerEloHistory", back_populates="player", cascade="all, delete-orphan")


class Game(Base):
    __tablename__ = "games"

    id = Column(String, primary_key=True)
    date = Column(Date, nullable=False)
    map_name = Column(mapname_enum, nullable=False)
    expansions = Column(ARRAY(expansion_enum), nullable=False)
    draft = Column(Boolean, nullable=False)
    generations = Column(Integer, nullable=False)

    player_results = relationship("PlayerResult", cascade="all, delete-orphan")
    awards = relationship("Award", cascade="all, delete-orphan")


class PlayerResult(Base):
    __tablename__ = "player_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(String, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    corporation = Column(corporation_enum, nullable=False)

    terraform_rating = Column(Integer, nullable=False)
    milestone_points = Column(Integer, nullable=False)
    milestones = Column(ARRAY(milestone_enum), nullable=False)
    award_points = Column(Integer, nullable=False)
    card_points = Column(Integer, nullable=False)
    card_resource_points = Column(Integer, nullable=False)
    greenery_points = Column(Integer, nullable=False)
    city_points = Column(Integer, nullable=False)
    turmoil_points = Column(Integer, nullable=True)
    mc_total = Column(Integer, nullable=False)

    game = relationship("Game", back_populates="player_results")
    player = relationship("Player", back_populates="results")


class Award(Base):
    __tablename__ = "awards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    award_name = Column(award_enum, nullable=False)
    opened_by = Column(String, ForeignKey("players.id"), nullable=False)
    first_place = Column(ARRAY(String), nullable=False)
    second_place = Column(ARRAY(String), nullable=False)

    game = relationship("Game", back_populates="awards")
    opened_by_player = relationship("Player", back_populates="opened_awards")


class PlayerAchievement(Base):
    __tablename__ = "player_achievements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    code = Column(String, nullable=False)
    tier = Column(Integer, nullable=False, default=1)
    unlocked_at = Column(Date, nullable=False)

    __table_args__ = (
        UniqueConstraint("player_id", "code", name="uq_player_achievement"),
    )

    player = relationship("Player", back_populates="achievements")


class PlayerEloHistory(Base):
    __tablename__ = "player_elo_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String, ForeignKey("players.id", ondelete="CASCADE"), nullable=False, index=True)
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True)
    elo_before = Column(Integer, nullable=False)
    elo_after = Column(Integer, nullable=False)
    delta = Column(Integer, nullable=False)
    recorded_at = Column(Date, nullable=False)

    player = relationship("Player", back_populates="elo_history")
