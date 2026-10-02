import os
import re
import datetime
import subprocess
import httpx
from typing import List, Dict, Any, Optional

from app.config import settings
from app.models.hdfs import HDFSFileInfo, HDFSFileListResponse, HDFSFileContentResponse
from app.models.system import ComponentStatus

class HDFSService:
    def __init__(self):
        self.webhdfs_url = f"{settings.HDFS_HTTP_URL}/webhdfs/v1"
        self.raw_path = settings.HDFS_RAW_PATH.rstrip('/')
        self.client = httpx.Client(timeout=10.0, follow_redirects=True)

    def _format_size(self, size_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}" if unit != 'B' else f"{size_bytes} B"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"

    def _sanitize_filename(self, filename: str) -> str:
        # Strip path traversal attempts and keep only basename
        clean = os.path.basename(filename.strip().replace('\\', '/'))
        if not re.match(r'^[a-zA-Z0-9_\-\.]+\.json$', clean) or '..' in clean:
            raise ValueError(f"Invalid or unsafe filename: {filename}")
        return clean

    def list_files(self, path: Optional[str] = None) -> HDFSFileListResponse:
        target_path = (path or self.raw_path).lstrip('/')
        url = f"{self.webhdfs_url}/{target_path}?op=LISTSTATUS"
        files_info: List[HDFSFileInfo] = []
        total_size = 0

        try:
            resp = self.client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                statuses = data.get("FileStatuses", {}).get("FileStatus", [])
                for item in statuses:
                    fn = item.get("pathSuffix", "")
                    sz = item.get("length", 0)
                    total_size += sz
                    mod_ts = item.get("modificationTime", 0) / 1000.0
                    mod_str = datetime.datetime.fromtimestamp(mod_ts, tz=datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                    is_dir = item.get("type") == "DIRECTORY"
                    files_info.append(
                        HDFSFileInfo(
                            filename=fn,
                            path=f"{self.raw_path}/{fn}",
                            size_bytes=sz,
                            size_formatted=self._format_size(sz),
                            modification_time=mod_str,
                            is_directory=is_dir
                        )
                    )
            else:
                # Fallback to CLI
                files_info = self._list_files_cli(self.raw_path)
                total_size = sum(f.size_bytes for f in files_info)
        except Exception:
            files_info = self._list_files_cli(self.raw_path)
            total_size = sum(f.size_bytes for f in files_info)

        return HDFSFileListResponse(
            path=self.raw_path,
            total_files=len(files_info),
            total_size_bytes=total_size,
            files=files_info
        )

    def _list_files_cli(self, path: str) -> List[HDFSFileInfo]:
        files_info = []
        cmd = f'"{settings.HADOOP_HOME}\\bin\\hdfs.cmd" dfs -ls {path}'
        try:
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            if proc.returncode == 0:
                lines = proc.stdout.strip().split('\n')
                for line in lines:
                    parts = line.split()
                    if len(parts) >= 8 and parts[0].startswith('-'):
                        sz = int(parts[4])
                        dt = f"{parts[5]} {parts[6]}"
                        filepath = parts[7]
                        fn = os.path.basename(filepath)
                        files_info.append(
                            HDFSFileInfo(
                                filename=fn,
                                path=filepath,
                                size_bytes=sz,
                                size_formatted=self._format_size(sz),
                                modification_time=dt,
                                is_directory=False
                            )
                        )
        except Exception:
            pass
        return files_info

    def get_file_content(self, filename: str, max_bytes: int = 10000000) -> HDFSFileContentResponse:
        clean_fn = self._sanitize_filename(filename)
        url = f"{self.webhdfs_url}/{self.raw_path.lstrip('/')}/{clean_fn}?op=OPEN&length={max_bytes}"
        raw_text = None
        truncated = False

        try:
            resp = self.client.get(url)
            if resp.status_code == 200:
                raw_text = resp.text
            else:
                # Fallback to local dataset file if WebHDFS read error
                local_path = os.path.join(settings.DATASET_PATH, clean_fn)
                if os.path.exists(local_path):
                    with open(local_path, "r", encoding="utf-8") as f:
                        raw_text = f.read(max_bytes)
        except Exception:
            local_path = os.path.join(settings.DATASET_PATH, clean_fn)
            if os.path.exists(local_path):
                with open(local_path, "r", encoding="utf-8") as f:
                    raw_text = f.read(max_bytes)

        if raw_text is None:
            raise FileNotFoundError(f"File {clean_fn} not found in HDFS {self.raw_path}")

        import json
        try:
            json_obj = json.loads(raw_text)
        except Exception:
            # If truncated or invalid partial json
            truncated = True
            json_obj = {"raw_preview": raw_text[:5000], "note": "Content truncated for preview"}

        size_bytes = len(raw_text.encode('utf-8'))
        return HDFSFileContentResponse(
            filename=clean_fn,
            path=f"{self.raw_path}/{clean_fn}",
            size_bytes=size_bytes,
            content_json=json_obj,
            preview_truncated=truncated
        )

    def check_health(self) -> ComponentStatus:
        url = f"{self.webhdfs_url}/{self.raw_path.lstrip('/')}?op=GETFILESTATUS"
        try:
            resp = self.client.get(url, timeout=3.0)
            if resp.status_code == 200:
                return ComponentStatus(
                    name="HDFS NameNode",
                    status="ok",
                    message="NameNode and WebHDFS responsive",
                    port=9870,
                    details={"path": self.raw_path, "webhdfs": "active"}
                )
            else:
                return ComponentStatus(
                    name="HDFS NameNode",
                    status="degraded",
                    message=f"WebHDFS responded with status {resp.status_code}",
                    port=9870
                )
        except Exception as e:
            return ComponentStatus(
                name="HDFS NameNode",
                status="down",
                message=f"Connection failed: {str(e)}",
                port=9870
            )

hdfs_service = HDFSService()
