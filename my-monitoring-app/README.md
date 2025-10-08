# My Monitoring App

A simple FastAPI application instrumented with Prometheus metrics, running inside Docker containers orchestrated by Docker Compose alongside Prometheus and Grafana for monitoring and visualization.

---

## Project Structure

my-monitoring-app/
├── app/
│ ├── app.py
│ └── requirements.txt
├── Dockerfile
├── prometheus/
│ └── prometheus.yml
|────promtail-config
├── docker-compose.yml
└── README.md


---

## Application Code (`app/app.py`)

```python
import logging
import random
import json
from fastapi import FastAPI, HTTPException
from prometheus_client import Counter, generate_latest
from starlette.responses import Response

# JSON Logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "time": self.formatTime(record, self.datefmt),
            "name": record.name,
            "level": record.levelname,
            "message": record.getMessage(),
        }
        return json.dumps(log_record)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger("my_app_logger")
logger.setLevel(logging.INFO)
logger.addHandler(handler)

app = FastAPI()
counter = Counter("my_app_requests_total", "Total number of requests")
error_counter = Counter("my_app_errors_total", "Total number of errors")

@app.get("/")
def read_root():
    if random.random() < 0.5:
        error_msg = "Simulated random error occurred!"
        logger.error(error_msg)
        error_counter.inc()
        raise HTTPException(status_code=500, detail=error_msg)
    
    counter.inc()
    logger.info("Root endpoint accessed successfully")
    return {"message": "Hello, Docker!"}

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type="text/plain")


# app/requirements.txt
fastapi
uvicorn
prometheus_client

```
## Dockerfile

```bash
FROM python:3.10-slim

WORKDIR /app
COPY ./app /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]

```

## prometheus/prometheus.yml
```bash
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

```


## Docker Compose
```bash


version: '3.8'

services:
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    privileged: true
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      # - /cgroup:/cgroup:ro  # Combine all cgroups into one
          
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=14d'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_LOG_LEVEL=error
    restart: unless-stopped

volumes:
  grafana_data:
  prometheus_data:


```

## promtail-config
```bash
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /run/promtail/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker-logs
          __path__: /var/lib/docker/containers/*/*.log

```


## Command 
```bash
docker-compose up --build

Accessing the Services :

FastAPI App	http://localhost:8000

Metrics Endpoint	http://localhost:8000/metrics

Prometheus	http://localhost:9090

Grafana	http://localhost:3000


# Grafana default login:

Username: admin

Password: admin

# Prometheus Query
sum(my_app_requests_total)

```