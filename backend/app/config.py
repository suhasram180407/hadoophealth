from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    HDFS_NAMENODE_URL: str = Field(default="hdfs://localhost:9000")
    HDFS_HTTP_URL: str = Field(default="http://localhost:9870")
    HDFS_RAW_PATH: str = Field(default="/healthcare/raw")
    HADOOP_HOME: str = Field(default=r"C:\hadoop")

    HBASE_REST_URL: str = Field(default="http://localhost:8080")
    HBASE_TABLE: str = Field(default="healthcare_patients")
    HBASE_COLUMN_FAMILY: str = Field(default="info")

    DATASET_PATH: str = Field(default=r"D:\assignment3db\dataset")

    API_HOST: str = Field(default="127.0.0.1")
    API_PORT: int = Field(default=8000)
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
