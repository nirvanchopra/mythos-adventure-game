import time
import logging
from collections import defaultdict

from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy.exc import SQLAlchemyError

from backend.routes import jobs
from backend.routes import story
from backend.routes import auth
from backend.routes import rewards
from backend.routes import progress
from backend.routes import multiplayer
from backend.routes import social
from backend.routes import leaderboard
from backend.core.config import settings

# Database imports
from backend.db.database import Base, engine

# Import models to register their tables
from backend.models.story import Story, StoryNode
from backend.models.jobs import StoryJob
from backend.models.user import User, PlayerProfile
from backend.models.progression import Achievement, PlayerAchievement, RewardTransaction, PlayerQuest
from backend.models.progress import PlayerProgress
from backend.models.multiplayer import MultiplayerRoom, RoomPlayer, RoomMessage
from backend.models.social import Friendship, ActivityFeedItem


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("adventure_game")

app = FastAPI(
    title="Mythos: Choose Your Own Adventure",
    description="A premium interactive multiplayer adventure gaming platform powered by FastAPI and Neon PostgreSQL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)


# Rate Limiter State & Middleware
_request_counts = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # 60s window
MAX_REQUESTS_GENERAL = 180  # 180 requests per min for game loops
MAX_REQUESTS_AUTH = 40      # 40 requests per min for auth/generation

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.scope.get("type") == "websocket" or request.url.path in ["/health", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        endpoint_key = f"{client_ip}:{request.url.path}"
        # Prune older timestamps
        _request_counts[endpoint_key] = [t for t in _request_counts[endpoint_key] if now - t < RATE_LIMIT_WINDOW]
        
        limit = MAX_REQUESTS_AUTH if ("/auth/" in request.url.path or "/stories/create" in request.url.path) else MAX_REQUESTS_GENERAL
        if len(_request_counts[endpoint_key]) >= limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down, adventurer."}
            )

        _request_counts[endpoint_key].append(now)
        return await call_next(request)

app.add_middleware(RateLimitMiddleware)


# CORS Middleware
origins = settings.Allowed_origins if settings.Allowed_origins else [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Exception Handlers
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error at {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "A database operation error occurred. Please try again shortly."}
    )


# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "Mythos Adventure Engine",
        "database": "Neon PostgreSQL",
        "version": "1.0.0"
    }


# Create database tables
Base.metadata.create_all(bind=engine)


# Register routers
app.include_router(
    auth.router,
    prefix=settings.API_PREFIX
)

app.include_router(
    rewards.router,
    prefix=settings.API_PREFIX
)

app.include_router(
    progress.router,
    prefix=settings.API_PREFIX
)

app.include_router(
    multiplayer.router,
    prefix=settings.API_PREFIX
)

app.include_router(
    social.router,
    prefix=settings.API_PREFIX
)

app.include_router(
    leaderboard.router,
    prefix=settings.API_PREFIX
)

app.include_router(
    story.router,
    prefix=settings.API_PREFIX
)

app.include_router(
    jobs.router,
    prefix=settings.API_PREFIX
)


@app.websocket("/ws/rooms/{room_code}")
async def ws_rooms_proxy(websocket: WebSocket, room_code: str, token: str = None):
    await multiplayer.room_websocket_endpoint(websocket, room_code, token)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
