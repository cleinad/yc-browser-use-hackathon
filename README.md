# yc-browser-use-hackathon

setup venv
```bash
uv venv --python 3.12
source .venv/bin/activate
# On Windows use `.venv\Scripts\activate`
```

run 5 parallel weather agents
```bash
cd bu-agent
./.venv/bin/python tests/run_weather_fanout.py --mode process --agents 5
```

run with visible browser windows
```bash
cd bu-agent
./.venv/bin/python tests/run_weather_fanout.py --mode process --agents 5 --show-browser
```
