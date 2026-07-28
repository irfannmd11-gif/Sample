"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Settings:
    secret_key: str
    download_dir: Path
    max_workbook_bytes: int
    ora_user: str | None
    ora_password: str | None
    ora_dsn: str | None
    workbook_base_url: str
    data_share_base_url: str

    @classmethod
    def from_environment(cls) -> "Settings":
        return cls(
            secret_key=os.getenv("FLASK_SECRET_KEY", "development-only-change-me"),
            download_dir=Path(os.getenv("WORKBOOK_DOWNLOAD_DIR", BASE_DIR / "data" / "downloads")),
            max_workbook_bytes=int(os.getenv("MAX_WORKBOOK_BYTES", 25 * 1024 * 1024)),
            ora_user=os.getenv("ORA_USER"),
            ora_password=os.getenv("ORA_PASS"),
            ora_dsn=os.getenv("ORA_DSN"),
            workbook_base_url=os.getenv(
                "WORKBOOK_BASE_URL", "https://workfront.adobe.com/internal/download?versionID="
            ),
            data_share_base_url=os.getenv("DATA_SHARE_BASE_URL", "https://workfront.adobe.com/"),
        )
