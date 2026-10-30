"""Wait for local services in CI; no submission code is executed here."""

import json
import os
import time
from urllib.error import URLError
from urllib.request import urlopen

api = os.getenv("AEL_API_TARGET", "http://127.0.0.1:8000")
web_url = os.getenv("AEL_WEB_URL", "http://127.0.0.1:5174")

for _attempt in range(60):
    try:
        with urlopen(f"{api}/api/v1/execution", timeout=2) as response:
            ready = json.load(response)["available"]
        with urlopen(web_url, timeout=2) as response:
            web = response.status == 200
        if ready and web:
            break
    except (URLError, TimeoutError):
        pass
    time.sleep(1)
else:
    raise SystemExit("Local services did not become ready")
