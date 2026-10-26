from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AEL_", env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://ael:ael_local@127.0.0.1:5432/ael"
    content_dir: Path = ROOT / "content/challenges"
    allowed_origins: list[str] = [
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    queue_limit: int = Field(default=8, ge=1, le=100)
    sandbox_image: str = "ael-python-sandbox:1"
    execution_timeout: int = Field(default=8, ge=1, le=20)
    worker_stale_seconds: int = 30
