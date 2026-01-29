from fastapi import FastAPI
from routes.games.routes import router as games_router

app = FastAPI(title="Terraforming Mars API")

app.include_router(games_router)
