import importlib.util
import json
import shutil

import pytest
from ael_api.config import ROOT
from ael_api.content import load_bundles
from ael_worker.judge import equivalent


def test_original_packages_are_verified_against_reference(bundles):
    assert len(bundles) == 12
    for slug, bundle in bundles.items():
        # Repository-authored reference code is trusted, never learner source.
        spec = importlib.util.spec_from_file_location(
            slug, ROOT / "content/challenges" / slug / "reference_solution.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        function = getattr(module, bundle.metadata.function_name)
        codec_spec = importlib.util.spec_from_file_location(
            "sandbox_bridge", ROOT / "infra/sandbox/entrypoint.py"
        )
        codec = importlib.util.module_from_spec(codec_spec)
        codec_spec.loader.exec_module(codec)
        for case in bundle.public + bundle.hidden:
            kwargs = codec.decode_inputs(case.kwargs)
            original = codec.snapshot_inputs(kwargs)
            if case.raises:
                with pytest.raises(ValueError):
                    function(**kwargs)
            else:
                assert equivalent(function(**kwargs), case.expected), case.name
            assert codec.snapshot_inputs(kwargs) == original
        if slug == "safe-cosine-similarity":
            for bad in (float("inf"), float("nan"), -float("inf")):
                with pytest.raises(ValueError):
                    function([0.0], [bad])


def test_learner_contract_does_not_contain_private_content(bundles):
    for bundle in bundles.values():
        content = bundle.learner()
        assert not {"hidden", "reference", "explanation"} & content.keys()
        assert len(content["public_cases"]) == len(bundle.public)
        assert "reference_solution" not in json.dumps(content)


def test_loader_rejects_bad_metadata_and_tracks_content_hash(tmp_path, bundles):
    source = ROOT / "content/challenges/safe-cosine-similarity"
    target = tmp_path / source.name
    shutil.copytree(source, target)
    before = load_bundles(tmp_path)[source.name].version_id
    (target / "problem.md").write_text("Changed content")
    assert load_bundles(tmp_path)[source.name].version_id != before
    (target / "metadata.yaml").write_text((target / "metadata.yaml").read_text() + "unknown: bad\n")
    with pytest.raises(ValueError):
        load_bundles(tmp_path)


def test_loader_rejects_empty_or_incomplete_suites(tmp_path):
    source = ROOT / "content/challenges/reciprocal-rank-fusion"
    target = tmp_path / source.name
    shutil.copytree(source, target)
    (target / "tests/hidden.json").write_text("[]")
    with pytest.raises(ValueError):
        load_bundles(tmp_path)
    (target / "tests/hidden.json").write_text('[{"name":"bad","kwargs":{}}]')
    with pytest.raises(ValueError):
        load_bundles(tmp_path)
