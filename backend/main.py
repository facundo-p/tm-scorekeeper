import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.admin_routes import router as admin_router
from routes.auth_routes import router as auth_router
from routes.dependencies import require_auth
from routes.games_routes import router as games_router
from routes.players_routes import router as players_router
from routes.records_routes import router as records_router
from routes.achievements_routes import router as achievements_router
from routes.elo_routes import router as elo_router


app = FastAPI(title="Terraforming Mars API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Secret"],
)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


# Públicos: /health y /auth/login (D-03). Todo lo demás exige un token Bearer.
app.include_router(auth_router)
_protected = [Depends(require_auth)]
for router in (games_router, players_router, records_router, achievements_router, elo_router, admin_router):
    app.include_router(router, dependencies=_protected)
