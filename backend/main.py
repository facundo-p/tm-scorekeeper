import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.games_routes import router as games_router
from routes.players_routes import router as players_router
from db.models import Base
from db.session import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: ensure tables exist
    Base.metadata.create_all(bind=engine)
    yield
    # shutdown: nothing to do

app = FastAPI(title="Terraforming Mars API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(games_router)
app.include_router(players_router)


