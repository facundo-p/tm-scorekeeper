import logging
import os
from contextlib import asynccontextmanager

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
from services.container import derived_service

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """D-13: si las reglas de derivación cambiaron, recalcula ELO y logros antes de atender."""
    try:
        derived_service.ensure_current()
    except Exception:  # la API arranca igual; el recálculo se puede pedir con /admin/recompute
        logger.exception("No se pudo verificar derived_version al arrancar")
    yield


app = FastAPI(title="Terraforming Mars API", lifespan=lifespan)

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
