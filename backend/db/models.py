from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Integer,
    String,
    Boolean,
    ForeignKey,
    Identity,
    Table,
    Enum as PgEnum,
    ARRAY,
    UniqueConstraint,
    CheckConstraint,
    Index,
    func,
    text,
)
from sqlalchemy.orm import relationship, declarative_base
from models.player_colors import PLAYER_COLORS
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
    color = Column(String, nullable=False)
    # Orden de alta: desempate estable de las listas de jugadores (D-74).
    seq = Column(Integer, Identity(), nullable=False)

    __table_args__ = (
        CheckConstraint(f"color IN ({', '.join(repr(c) for c in PLAYER_COLORS)})", name="ck_players_color"),
        UniqueConstraint("seq", name="uq_players_seq"),
        Index("uq_players_active_color", "color", unique=True, postgresql_where=text("is_active")),
    )

    results = relationship("PlayerResult", back_populates="player")
    opened_awards = relationship("Award", back_populates="opened_by_player")
    elo_history = relationship("PlayerEloHistory", back_populates="player", cascade="all, delete-orphan")


class Game(Base):
    __tablename__ = "games"

    id = Column(String, primary_key=True)
    date = Column(Date, nullable=False)
    map_name = Column(mapname_enum, nullable=False)
    expansions = Column(ARRAY(expansion_enum), nullable=False)
    draft = Column(Boolean, nullable=False)
    generations = Column(Integer, nullable=False)
    # Orden canónico (fecha, created_at, id): dentro de un mismo día, la que se cargó antes (F21, D-56).
    # clock_timestamp(): la hora real del INSERT (now() sería la del inicio de la transacción, antes del lock).
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.clock_timestamp())

    player_results = relationship("PlayerResult", cascade="all, delete-orphan")
    awards = relationship("Award", cascade="all, delete-orphan")


class PlayerResult(Base):
    __tablename__ = "player_results"
    __table_args__ = (
        UniqueConstraint("game_id", "player_id", name="uq_player_result_game_player"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(String, ForeignKey("players.id", ondelete="CASCADE"), nullable=False, index=True)
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
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True)
    award_name = Column(award_enum, nullable=False)
    opened_by = Column(String, ForeignKey("players.id"), nullable=False)
    first_place = Column(ARRAY(String), nullable=False)
    second_place = Column(ARRAY(String), nullable=False)

    game = relationship("Game", back_populates="awards")
    opened_by_player = relationship("Player", back_populates="opened_awards")


class AchievementUnlock(Base):
    """Un nivel de logro alcanzado, fechado con la partida que lo alcanzó (D-04). Es derivado:
    se regenera completo en cada escritura de partidas (F23, STAT-04/05)."""
    __tablename__ = "achievement_unlocks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    code = Column(String, nullable=False)
    tier = Column(Integer, nullable=False)
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True)
    unlocked_on = Column(Date, nullable=False)

    __table_args__ = (
        UniqueConstraint("player_id", "code", "tier", name="uq_achievement_unlock"),
    )


class AppMeta(Base):
    """Pares clave/valor de la aplicación; `derived_version` (D-13)."""
    __tablename__ = "app_meta"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class PlayerEloHistory(Base):
    __tablename__ = "player_elo_history"
    __table_args__ = (
        UniqueConstraint("player_id", "game_id", name="uq_elo_history_player_game"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String, ForeignKey("players.id", ondelete="CASCADE"), nullable=False, index=True)
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True)
    elo_before = Column(Integer, nullable=False)
    elo_after = Column(Integer, nullable=False)
    delta = Column(Integer, nullable=False)
    recorded_at = Column(Date, nullable=False, index=True)

    player = relationship("Player", back_populates="elo_history")
