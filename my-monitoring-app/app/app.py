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
