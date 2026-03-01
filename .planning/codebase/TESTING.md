# Testing Patterns

**Analysis Date:** 2026-02-28

## Test Framework

**Runner:** No formal test framework configured

- No `pytest`, `unittest`, or other test runner detected
- No `pyproject.toml`, `setup.cfg`, or `pytest.ini` configuration files
- No `conftest.py` files
- No `test_*.py` or `*_test.py` files following standard naming conventions

**Run Commands:**
```bash
# No standard test commands available
# The only "test" is a manual integration script:
cd bu-agent
./.venv/bin/python tests/run_weather_fanout.py --mode process --agents 5
```

## Test File Organization

**Location:** `bu-agent/tests/`

**Current files:**
- `bu-agent/tests/run_weather_fanout.py` - Manual integration/demo script (not an automated test)

**Naming:** No test naming convention established. The single file in `tests/` is a runnable script, not an automated test.

## What Exists: Manual Integration Script

The only test-like artifact is `bu-agent/tests/run_weather_fanout.py`, which is a CLI-driven integration demo that:

1. Selects random cities from a pool
2. Creates `SubAgentJob` instances for each
3. Runs them through either `ProcessSubAgentOrchestrator` or `SubAgentOrchestrator`
4. Prints results and writes JSON output

**This is NOT an automated test** -- it requires a live `BROWSER_USE_API_KEY`, launches real browser instances, and hits live weather websites. It has no assertions, no pass/fail criteria beyond whether agents return results, and no way to run headlessly without external dependencies.

**Example invocation (from `README.md`):**
```bash
cd bu-agent
./.venv/bin/python tests/run_weather_fanout.py --mode process --agents 5
./.venv/bin/python tests/run_weather_fanout.py --mode process --agents 5 --show-browser
```

**CLI arguments:**
- `--mode process|inprocess` - Isolation mode
- `--agents N` - Number of parallel agents (default: 5)
- `--show-browser` - Visible browser windows
- `--seed N` - Reproducible city selection
- `--timeout-sec N` - Per-agent timeout (default: 180)
- `--max-steps N` - Max browser steps (default: 35)
- `--retries N` - Retry count (default: 0)
- `--output PATH` - Output JSON path

## Mocking

**Framework:** None

**No mocking infrastructure exists.** The codebase has no mock objects, test doubles, or dependency injection patterns specifically for testing. However, the architecture supports testability:

- `BrowserUseSubAgent` accepts an `llm_factory` parameter, enabling injection of a mock LLM
- `SubAgentOrchestrator` accepts a `subagent_runner` parameter, enabling injection of a mock runner
- `ProcessSubAgentOrchestrator` accepts `python_executable` and `worker_module` parameters

**If adding mocks, use these injection points:**
```python
# Mock the subagent runner for orchestrator tests
mock_runner = BrowserUseSubAgent(llm_factory=lambda: MockLLM())
orchestrator = SubAgentOrchestrator(config=config, subagent_runner=mock_runner)

# Or inject entirely custom runner
orchestrator = SubAgentOrchestrator(config=config, subagent_runner=custom_mock)
```

## Fixtures and Factories

**Test Data:** No fixtures or factory functions exist for testing.

**Candidate factory patterns already in the codebase:**
- `build_jobs()` in `bu-agent/tests/run_weather_fanout.py` creates `SubAgentJob` lists
- `build_bootstrap_failure()` in `bu-agent/proquote/worker_subagent.py` creates failure `SubAgentResult` objects
- `result_to_dict()` in `bu-agent/proquote/models.py` serializes results

## Coverage

**Requirements:** None enforced. No coverage tooling configured.

## Test Types

**Unit Tests:**
- None exist. The following are good candidates for unit testing:
  - `bu-agent/proquote/models.py` - Pure dataclasses and utility functions (`utc_now`, `result_to_dict`)
  - `bu-agent/proquote/worker_subagent.py` - `load_job()` validation logic, `build_bootstrap_failure()`
  - `bu-agent/proquote/process_orchestrator.py` - `_sanitize_temp_prefix_fragment()`, `_parse_worker_result()`, `_merge_errors()`, `_trim()`

**Integration Tests:**
- None exist as automated tests. The manual `run_weather_fanout.py` script serves this role informally.

**E2E Tests:**
- Not applicable in the traditional sense. The entire system is an E2E browser automation tool.

## Recommendations for Adding Tests

**Install pytest and create config:**
```bash
uv pip install pytest pytest-asyncio
```

**Suggested test structure:**
```
bu-agent/
├── tests/
│   ├── conftest.py              # Shared fixtures
│   ├── test_models.py           # Unit tests for models.py
│   ├── test_worker_subagent.py  # Unit tests for job loading, result building
│   ├── test_orchestrator.py     # Tests with mocked BrowserUseSubAgent
│   ├── test_process_orchestrator.py  # Tests with mocked subprocess
│   └── run_weather_fanout.py    # Keep as manual integration demo
```

**Priority test targets (pure functions, no external deps):**
1. `result_to_dict()` - Verify ISO format serialization
2. `load_job()` - Verify validation of required keys and missing metadata handling
3. `_sanitize_temp_prefix_fragment()` - Verify edge cases (empty string, special chars, long input)
4. `_parse_worker_result()` - Verify JSON payload parsing
5. `_merge_errors()` - Verify error aggregation logic
6. `_trim()` - Verify truncation at limit

**Example test pattern for this codebase:**
```python
# tests/test_models.py
import pytest
from proquote.models import SubAgentResult, result_to_dict, utc_now

def test_result_to_dict_serializes_datetimes_as_iso():
    now = utc_now()
    result = SubAgentResult(
        job_id="test-1",
        label="test",
        task="do something",
        success=True,
        started_at=now,
        finished_at=now,
        duration_seconds=0.0,
    )
    payload = result_to_dict(result)
    assert payload["started_at"] == now.isoformat()
    assert payload["finished_at"] == now.isoformat()
```

```python
# tests/test_worker_subagent.py
import json
import pytest
from pathlib import Path
from proquote.worker_subagent import load_job

def test_load_job_raises_on_missing_keys(tmp_path):
    job_file = tmp_path / "bad.json"
    job_file.write_text(json.dumps({"job_id": "1"}))
    with pytest.raises(ValueError, match="missing required keys"):
        load_job(job_file)

def test_load_job_defaults_metadata_to_empty_dict(tmp_path):
    job_file = tmp_path / "ok.json"
    job_file.write_text(json.dumps({"job_id": "1", "label": "x", "task": "y"}))
    job = load_job(job_file)
    assert job["metadata"] == {}
```

**Async test pattern:**
```python
# tests/test_orchestrator.py
import pytest
from proquote.models import OrchestratorConfig, SubAgentJob, SubAgentResult, utc_now

@pytest.mark.asyncio
async def test_run_jobs_returns_empty_for_no_jobs():
    from proquote.orchestrator import SubAgentOrchestrator
    orch = SubAgentOrchestrator(OrchestratorConfig())
    results = await orch.run_jobs([])
    assert results == []
```

---

*Testing analysis: 2026-02-28*
