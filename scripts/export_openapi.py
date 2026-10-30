"""Export deterministic API contracts without starting services or connecting to a database."""

import json
import sys
from pathlib import Path

from ael_api.main import create_app

schema = create_app().openapi()
output = json.dumps(schema, indent=2, sort_keys=True) + "\n"
if len(sys.argv) > 1:
    Path(sys.argv[1]).write_text(output)
else:
    print(output, end="")
