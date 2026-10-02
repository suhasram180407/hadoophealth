from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.config import settings
from app.routes import (
    health_router,
    system_router,
    patients_router,
    hdfs_router,
    ingestion_router
)
from app.services.hbase_service import hbase_service

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("healthcare_backend")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Healthcare Data Storage Backend...")
    try:
        table_ok = hbase_service.ensure_table_exists()
        logger.info(f"HBase table '{settings.HBASE_TABLE}' initialized: {table_ok}")
    except Exception as e:
        logger.warning(f"Could not connect to HBase on startup: {str(e)}")
    yield
    logger.info("Shutting down Healthcare Data Storage Backend...")

app = FastAPI(
    title="Healthcare Data Storage System API",
    description="FastAPI Backend for HDFS raw JSON storage and HBase structured clinical records",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend development dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(system_router)
app.include_router(patients_router)
app.include_router(hdfs_router)
app.include_router(ingestion_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please verify backend diagnostics."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)
