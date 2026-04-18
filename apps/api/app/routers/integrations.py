from fastapi import APIRouter, HTTPException

from app.schemas.common import IntegrationStatus, SyncResponse
from app.services.store import integrations

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/", response_model=list[IntegrationStatus])
def list_integrations() -> list[IntegrationStatus]:
    return list(integrations.values())


@router.get("/{provider}/connect", response_model=IntegrationStatus)
def connect_provider(provider: str) -> IntegrationStatus:
    integration = integrations.get(provider)
    if not integration:
        raise HTTPException(status_code=404, detail="Unknown provider")
    integration.connected = True
    integration.status_note = f"{provider} connected in demo mode."
    return integration


@router.post("/{provider}/sync", response_model=SyncResponse)
def sync_provider(provider: str) -> SyncResponse:
    integration = integrations.get(provider)
    if not integration:
        raise HTTPException(status_code=404, detail="Unknown provider")
    integration.connected = True
    integration.last_synced_at = SyncResponse(provider_name=provider, synced_records=0, summary="").last_synced_at
    summary = {
        "google_calendar": "Pulled 4 events and identified two tight meal windows.",
        "gmail": "Flagged one travel confirmation and one late dinner event.",
        "strava": "Imported 2 recent workouts.",
    }.get(provider, "Sync completed.")
    synced_records = {"google_calendar": 4, "gmail": 2, "strava": 2}.get(provider, 1)
    integration.status_note = summary
    return SyncResponse(provider_name=provider, synced_records=synced_records, summary=summary)
