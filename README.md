# yc-browser-use-hackathon

setup venv
```bash
uv venv --python 3.12
source .venv/bin/activate
# On Windows use `.venv\Scripts\activate`
```

## PartSource orchestrator

Run interactively (REPL):
```bash
cd bu-agent
./.venv/bin/python run.py
```

Run with a one-shot request:
```bash
cd bu-agent
./.venv/bin/python run.py "I need a 1/2 inch brass ball valve and a wax ring for a standard toilet"
```

## Weather fanout test

Run 5 parallel weather agents
```bash
cd bu-agent
./.venv/bin/python tests/run_weather_fanout.py --mode process --agents 5
```

run with visible browser windows
```bash
cd bu-agent
./.venv/bin/python tests/run_weather_fanout.py --mode process --agents 5 --show-browser
```
