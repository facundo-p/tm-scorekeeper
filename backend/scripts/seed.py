"""
Seed script for local development.
Creates initial players if they don't already exist.
Run via entrypoint.sh when SEED_DATA=true.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import get_session
from db.models import Player as PlayerORM

SEED_PLAYERS = ["Facu", "Bru", "Marian", "Efra", "Clau", "Albert"]

with get_session() as session:
    existing_names = {p.name for p in session.query(PlayerORM).all()}
    added = []
    for name in SEED_PLAYERS:
        if name not in existing_names:
            from uuid import uuid4
            session.add(PlayerORM(id=str(uuid4()), name=name, is_active=True))
            added.append(name)
    session.commit()

if added:
    print(f"Seeded players: {', '.join(added)}")
else:
    print("Seed players already exist, skipping.")
