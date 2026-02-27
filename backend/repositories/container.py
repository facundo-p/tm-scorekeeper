"""Dependency container selecting repository implementations.

By default the PostgreSQL repositories are used.  The environment
variable ``USE_POSTGRES`` may be inspected in the future if a different
backend is desired, but mocks have been removed as per project
requirements.  Both repository classes expect a session factory that
produces SQLAlchemy sessions from :mod:`db.session`.
"""

from repositories.game_repository import GamesRepository
from repositories.player_repository import PlayersRepository

# instantiate concrete repos; additional configuration (e.g. test
# sessions) can be injected by modifying these variables at startup.

games_repository = GamesRepository()
players_repository = PlayersRepository()
