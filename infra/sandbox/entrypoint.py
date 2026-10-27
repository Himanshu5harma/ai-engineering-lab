"""Trusted bridge, executed ONLY inside the isolated runtime.

No expected values or pass/fail decisions enter the container. The external worker
checks returned data against trusted fixtures. This bridge is not a security boundary.
"""

import base64
import contextlib
import io
import json
import os
import sys
import zlib


class OutputLimitError(Exception):
    pass


class BoundedOutput(io.StringIO):
    def write(self, value):
        if self.tell() + len(value) > 4096:
            raise OutputLimitError("Output exceeded 4096 characters for a test")
        return super().write(value)


def decode_inputs(value):
    """Decode fixture-only nonfinite floats without executing fixture expressions."""
    if isinstance(value, dict):
        if set(value) == {"$set"} and isinstance(value["$set"], list):
            return set(decode_inputs(item) for item in value["$set"])
        if set(value) == {"$float"} and value["$float"] in ("nan", "inf", "-inf"):
            return float(value["$float"])
        return {key: decode_inputs(item) for key, item in value.items()}
    if isinstance(value, list):
        return [decode_inputs(item) for item in value]
    return value


def snapshot_inputs(value):
    return json.dumps(
        value,
        sort_keys=True,
        default=lambda item: sorted(item) if isinstance(item, set) else str(item),
    )


def main():
    payload = json.loads(zlib.decompress(base64.b64decode(os.environ.pop("AEL_PAYLOAD"))))
    responses = []
    namespace = {"__name__": "solution"}
    output = BoundedOutput()
    try:
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            exec(compile(payload["code"], "solution.py", "exec"), namespace)
        function = namespace[payload["function"]]
    except BaseException as exc:
        response = {
            "exception": type(exc).__name__,
            "error": str(exc)[:2000],
            "stdout": output.getvalue(),
        }
        print(json.dumps([response for _ in payload["inputs"]], allow_nan=False))
        return
    for kwargs in decode_inputs(payload["inputs"]):
        original = snapshot_inputs(kwargs)
        output = BoundedOutput()
        response = {}
        try:
            with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                response["value"] = function(**kwargs)
            # Reject unsupported return values instead of emitting an invalid JSON protocol.
            json.dumps(response, allow_nan=False)
        except BaseException as exc:
            response = {"exception": type(exc).__name__, "error": str(exc)[:2000]}
        response["stdout"] = output.getvalue()
        response["mutated"] = original != snapshot_inputs(kwargs)
        responses.append(response)
    sys.stdout.write(json.dumps(responses, allow_nan=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
