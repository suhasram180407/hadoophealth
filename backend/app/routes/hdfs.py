from fastapi import APIRouter, HTTPException
from app.models.hdfs import HDFSFileListResponse, HDFSFileContentResponse
from app.services.hdfs_service import hdfs_service

router = APIRouter(prefix="/api/hdfs", tags=["HDFS"])

@router.get("/files", response_model=HDFSFileListResponse)
def list_raw_files():
    """Returns list of raw healthcare JSON files under HDFS /healthcare/raw."""
    try:
        return hdfs_service.list_files()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list HDFS files: {str(e)}")

@router.get("/files/{filename}", response_model=HDFSFileContentResponse)
def get_raw_file_content(filename: str):
    """Safely retrieves and parses a raw JSON file under HDFS /healthcare/raw."""
    try:
        return hdfs_service.get_file_content(filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except FileNotFoundError as fe:
        raise HTTPException(status_code=404, detail=str(fe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file {filename}: {str(e)}")
