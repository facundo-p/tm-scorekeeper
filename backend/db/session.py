from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# read DATABASE_URL from environment or use a default that matches the docker-compose service
# default connects to the docker container if available
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper"  # credentials for tm_user
)

engine = create_engine(DATABASE_URL)
# expire_on_commit=False: los repositorios confirman al salir de su bloque (db/uow.py) y
# algunos devuelven filas ORM ya leídas; no deben vaciarse al confirmar.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)


def get_session():
    """Return a new SQLAlchemy Session."""
    return SessionLocal()
