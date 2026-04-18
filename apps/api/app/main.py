from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import activity, auth, coach, fridge, grocery, integrations, recommendations, user

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Hackathon-ready backend for RoamWell.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(user.router, prefix=settings.api_prefix)
app.include_router(integrations.router, prefix=settings.api_prefix)
app.include_router(recommendations.router, prefix=settings.api_prefix)
app.include_router(fridge.router, prefix=settings.api_prefix)
app.include_router(grocery.router, prefix=settings.api_prefix)
app.include_router(activity.router, prefix=settings.api_prefix)
app.include_router(coach.router, prefix=settings.api_prefix)
