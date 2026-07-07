from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    NEWS_API_KEY: str
    DATABASE_URL: str = "sqlite:///./news.db"
    DEBUG: bool = False
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8",extra="ignore" )

settings = Settings()
