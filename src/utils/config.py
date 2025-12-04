# src/utils/config.py
import os
from dataclasses import dataclass
from typing import List
from pathlib import Path

@dataclass
class APIConfig:
    """Configuration for external APIs."""
    flightaware_key: str
    ncdc_token: str
    
    @classmethod
    def from_env(cls) -> 'APIConfig':
        """
        Load API configuration from environment variables.
        
        Create a .env file in your project root with:
        FLIGHTAWARE_API_KEY=your_key_here
        NCDC_API_TOKEN=your_token_here
        """
        # Try to load from .env file if it exists
        env_path = Path(__file__).parent.parent.parent / '.env'
        if env_path.exists():
            from dotenv import load_dotenv
            load_dotenv(env_path)
        
        flightaware_key = os.getenv('FLIGHTAWARE_API_KEY', '')
        ncdc_token = os.getenv('NCDC_API_TOKEN', '')
        
        if not flightaware_key or not ncdc_token:
            raise ValueError(
                "API keys not found. Set FLIGHTAWARE_API_KEY and NCDC_API_TOKEN "
                "environment variables or create a .env file."
            )
        
        return cls(
            flightaware_key=flightaware_key,
            ncdc_token=ncdc_token
        )

@dataclass
class CollectionConfig:
    """Configuration for data collection behavior."""
    # Which airports to collect data for
    # Start with major hubs, expand later
    airports: List[str]
    
    # How far back to collect data (in days)
    lookback_days: int = 1
    
    # Output directory structure
    output_dir: Path = Path('data/collected')
    
    # Rate limiting (seconds between requests)
    flightaware_rate_limit: float = 0.1  # 10 requests/second
    ncdc_rate_limit: float = 0.2  # 5 requests/second (NCDC is stricter)
    
    # Retry configuration
    max_retries: int = 3
    retry_delay: float = 1.0  # Initi