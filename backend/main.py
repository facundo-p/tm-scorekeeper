import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.games_routes import router as games_router
from routes.players_routes import router as players_router
from routes.records_routes import router as records_router



app = FastAPI(title="Terraforming Mars API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(games_router)
app.include_router(players_router)
app.include_router(records_router)


