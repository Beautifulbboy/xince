from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "My Test App Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()