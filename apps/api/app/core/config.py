from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RoamWell API"
    app_env: str = "development"
    api_prefix: str = "/api"
    cors_origins: list[str] = ["*"]
    openai_model: str = "gpt-4.1-mini"
    google_maps_enabled: bool = False
    google_calendar_enabled: bool = False
    gmail_enabled: bool = False
    strava_enabled: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
