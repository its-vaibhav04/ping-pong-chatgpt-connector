from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .ai_engine import AIEngine
from .mcp_server import create_mcp_server
from .models import AIMoveResponse, GameSnapshot

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

ai_engine = AIEngine()
mcp_server = create_mcp_server()


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with mcp_server.session_manager.run():
        yield


app = FastAPI(title="AI Pong Arena", lifespan=lifespan)
app.router.redirect_slashes = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/")
async def serve_frontend():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "message": "Frontend build not found. Run 'npm install && npm run build' inside frontend/."
    }


@app.post("/ai-move", response_model=AIMoveResponse)
async def ai_move(snapshot: GameSnapshot) -> AIMoveResponse:
    return await ai_engine.get_ai_move(snapshot)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.mount("/mcp", mcp_server.streamable_http_app())
