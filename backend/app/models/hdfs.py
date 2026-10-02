from typing import List, Any
from pydantic import BaseModel

class HDFSFileInfo(BaseModel):
    filename: str
    path: str
    size_bytes: int
    size_formatted: str
    modification_time: str
    is_directory: bool = False

class HDFSFileListResponse(BaseModel):
    path: str
    total_files: int
    total_size_bytes: int
    files: List[HDFSFileInfo]

class HDFSFileContentResponse(BaseModel):
    filename: str
    path: str
    size_bytes: int
    content_json: Any
    preview_truncated: bool = False
