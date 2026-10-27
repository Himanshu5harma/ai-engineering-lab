"""Verify one authored package using the real isolated runtime and deliberate mutants."""

import argparse
import json

from ael_api.config import Settings
from ael_api.content import load_bundles
from ael_worker.runner import DockerRunner

parser = argparse.ArgumentParser()
parser.add_argument("slug")
args = parser.parse_args()
settings = Settings()
bundle = load_bundles(settings.content_dir)[args.slug]
runner = DockerRunner(settings.sandbox_image, 8)
ready, message = runner.available()
if not ready:
    raise SystemExit(message)
for action in ("run", "submit"):
    result = runner.run(bundle, bundle.reference, action)
    if result.status != "passed":
        raise SystemExit(f"Reference failed {action}: {result}")
for source in [bundle.starter] + [
    p.read_text() for p in (settings.content_dir / args.slug / "tests").glob("buggy*.py")
]:
    result = runner.run(bundle, source, "submit")
    if result.status != "failed":
        raise SystemExit(f"Expected deterministic test failure, received: {result}")
print(
    json.dumps(
        {
            "slug": args.slug,
            "reference": "passed",
            "starter_and_buggy": "rejected",
            "public": len(bundle.public),
            "hidden": len(bundle.hidden),
        }
    )
)
