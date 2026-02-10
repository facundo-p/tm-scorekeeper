from fastapi import FastAPI
from backend.routes.games_routes import router as games_router
from backend.routes.players_routes import router as players_router

app = FastAPI(title="Terraforming Mars API")

app.include_router(games_router)
app.include_router(players_router)