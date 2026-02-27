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
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_session():
    """Return a new SQLAlchemy Session."""
    return SessionLocal()
