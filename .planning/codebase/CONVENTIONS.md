# Coding Conventions

**Analysis Date:** 2026-02-28

## Language & Runtime

**Primary Language:** Python 3.12
- All source files use `from __future__ import annotations` for PEP 604 union syntax (`str | None`)
- Virtual environment managed with `uv`

## Naming Patterns

**Files:**
- Use `snake_case.py` for all Python modules
- Example: `worker_subagent.py`, `process_orchestrator.py`, `models.py`

**Functions:**
- Use `snake_case` for all functions and methods
- Prefix private methods with single underscore: `_run_single_job`, `_emit`, `_trim`
- Factory/builder functions use descriptive verbs: `build_jobs()`, `build_bootstrap_failure()`

**Variables:**
- Use `snake_case` for local variables and parameters
- Use `UPPER_SNAKE_CASE` for module-level constants: `CITY_POOL`, `PROJECT_ROOT`

**Classes:**
- Use `PascalCase`: `SubAgentOrchestrator`, `ProcessSubAgentOrchestrator`, `BrowserUseSubAgent`
- Dataclasses use `PascalCase`: `OrchestratorConfig`, `SubAgentJob`, `SubAgentResult`, `StatusEvent`

**Types:**
- Use `PascalCase` for type aliases: `StatusHandler`, `StatusEventType`
- Type aliases defined at module level near the top

## Code Style

**Formatting:**
- No explicit formatter config detected (no `pyproject.toml`, `ruff.toml`, `.flake8`, or `setup.cfg`)
- Code follows standard PEP 8 with 4-space indentation
- Line length appears to be ~120 characters max (long strings in `worker_subagent.py` line 148)

**Linting:**
- Uses `noqa: BLE001` comments to suppress broad exception catches, suggesting ruff or flake8-bugbear awareness
- No linter config file present; linting rules are implicit

**Prescriptive guidance:**
- Use `from __future__ import annotations` at the top of every Python file
- Use `noqa: BLE001` when catching `Exception` broadly (which is the intentional pattern for resilience)
- Follow PEP 8 naming conventions throughout

## Import Organization

**Order:**
1. `from __future__ import annotations` (always first)
2. Standard library imports (`asyncio`, `json`, `sys`, `tempfile`, `pathlib`, etc.)
3. Third-party imports (`browser_use`, `dotenv`)
4. Local/relative imports (`.models`, `.orchestrator`)

**Style:**
- Use `from X import Y` style for specific imports rather than `import X`
- Use relative imports within the `proquote` package: `from .models import ...`
- Group imports by category with blank lines between groups

**Path Aliases:**
- None used; all imports are relative or absolute

## Dataclass Patterns

**Use `@dataclass(slots=True)` for all data models.** See `bu-agent/proquote/models.py`.

```python
@dataclass(slots=True)
class SubAgentJob:
    job_id: str
    label: str
    task: str
    metadata: dict[str, Any] = field(default_factory=dict)
```

**Key conventions:**
- All dataclasses use `slots=True` for memory efficiency
- Mutable defaults use `field(default_factory=...)` (never bare `[]` or `{}`)
- Use `dataclasses.asdict()` for serialization, with manual ISO format conversion for datetimes
- Use `dataclasses.replace()` for shallow copies

## Error Handling

**Strategy:** Defensive, resilient -- never let a single failure crash the orchestrator.

**Patterns:**
- Catch broad `Exception` with `# noqa: BLE001` at process boundaries
- Always record errors as strings in a list: `errors.append(f"{type(exc).__name__}: {exc}")`
- Use `finally` blocks to ensure browser cleanup even on failure
- Return structured failure results instead of raising -- see `_build_failure_result()` in `bu-agent/proquote/process_orchestrator.py`
- Silently swallow cleanup errors (e.g., `agent.close()` in a bare `except Exception: pass`)

**Example (from `bu-agent/proquote/worker_subagent.py` lines 70-88):**
```python
try:
    history = await asyncio.wait_for(
        agent.run(max_steps=max_steps),
        timeout=timeout_sec,
    )
    final_result = history.final_result()
    errors.extend(error for error in history.errors() if error)
    success = bool(final_result and final_result.strip())
except asyncio.TimeoutError:
    errors.append(f"Timed out after {timeout_sec} seconds")
except Exception as exc:  # noqa: BLE001
    errors.append(f"{type(exc).__name__}: {exc}")
finally:
    try:
        await agent.close()
    except Exception:  # noqa: BLE001
        pass
```

## Async Patterns

**Framework:** `asyncio` (stdlib)

**Conventions:**
- Use `asyncio.Semaphore` for concurrency limiting
- Use `asyncio.create_task()` + `asyncio.gather()` for parallel execution
- Use `asyncio.wait_for()` with explicit timeouts for all external operations
- Use `asyncio.create_subprocess_exec()` for process-isolated subagents
- Entry points use `asyncio.run()` in `if __name__ == "__main__"` blocks

**Status callbacks support both sync and async handlers:**
```python
async def _emit(self, handler: StatusHandler | None, event: StatusEvent) -> None:
    if handler is None:
        return
    emitted = handler(event)
    if asyncio.iscoroutine(emitted):
        await emitted
```

## Constructor Patterns

**Use keyword-only arguments for complex constructors:**
```python
def __init__(
    self,
    *,
    max_steps: int = 40,
    timeout_sec: int = 180,
    use_vision: bool = False,
    headless: bool = True,
    llm_factory: Callable[[], ChatBrowserUse] | None = None,
) -> None:
```

**Use `None` defaults with fallback construction:**
```python
self._config = config or OrchestratorConfig()
self._subagent_runner = subagent_runner or BrowserUseSubAgent(...)
```

## Logging

**Framework:** `print()` statements only (no logging framework configured)

**Pattern:** Status events are emitted via callback (`StatusHandler`) rather than direct logging. The test runner uses `print()` for output.

## Comments

**When to Comment:**
- Docstrings on classes only (brief, one-line): `"""Thin adapter around browser-use Agent."""`
- No function-level docstrings; function signatures are self-documenting
- No inline comments except `noqa` directives
- Module-level docstrings in `__init__.py`: `"""ProQuote orchestration package."""`

## Module Design

**Exports:**
- Use `__all__` in `__init__.py` to explicitly declare public API
- See `bu-agent/proquote/__init__.py`

**Package structure:**
- `models.py` - Pure data types and utility functions (no I/O)
- `orchestrator.py` - In-process orchestrator (async, shares event loop)
- `process_orchestrator.py` - Process-isolated orchestrator (spawns subprocess per job)
- `worker_subagent.py` - CLI entry point for subprocess workers

**Separation of concerns:**
- Models are pure dataclasses with no behavior beyond serialization helpers
- Orchestrators handle concurrency, retries, and status reporting
- Worker is a standalone CLI script that can run in isolation

## Type Annotations

**Fully typed codebase:**
- All function signatures include parameter types and return types
- Use `Literal` for constrained string unions (`StatusEventType`)
- Use `Callable` with full signatures for callback types
- Use `Sequence` (not `list`) for input parameters accepting any sequence
- Use `list` for concrete return types

---

*Convention analysis: 2026-02-28*
