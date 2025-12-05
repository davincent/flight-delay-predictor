import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
from pathlib import Path

class FlightAwareClient:
    """
    Client for FlightAware AeroAPI.
    
    FlightAware provides real-time and historical flight data including
    delays, cancellations, and actual vs scheduled times.
    """
    
    def __init__(self, api_key: str, rate_limit: float = 0.1):
        """
        Initialize FlightAware client.
        
        Args:
            api_key: Your FlightAware API key
            rate_limit: Minimum seconds between requests
        """
        self.api_key = api_key
        self.base_url = "https://aeroapi.flightaware.com/aeroapi"
        self.rate_limit = rate_limit
        self.last_request_time = 0
        
        self.headers = {
            "x-apikey": api_key,
            "Accept": "application/json"
        }
    
    def _rate_limit_wait(self):
        """
        Enforce rate limiting between requests.
        
        This prevents hitting API rate limits by ensuring minimum
        time between consecutive requests.
        """
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit:
            time.sleep(self.rate_limit - elapsed)
        self.last_request_time = time.time()
    
    def _make_request(self, endpoint: str, params: Dict) -> Optional[Dict]:
        """
        Make a rate-limited request to FlightAware API.
        
        Args:
            endpoint: API endpoint (e.g., '/airports/KATL/flights')
            params: Query parameters
            
        Returns:
            JSON response as dict, or None if request fails
        """
        self._rate_limit_wait()
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                # Rate limited - wait and retry
                retry_after = int(response.headers.get('Retry-After', 60))
                print(f"Rate limited. Waiting {retry_after} seconds...")
                time.sleep(retry_after)
                return self._make_request(endpoint, params)
            else:
                print(f"API error {response.status_code}: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def get_airport_flights(self, airport_code: str, 
                           start_time: datetime,
                           end_time: datetime,
                           flight_type: str = "departures") -> List[Dict]:
        """
        Get flights for a specific airport and time range.
        
        Args:
            airport_code: ICAO airport code (e.g., 'KATL' for Atlanta)
            start_time: Start of time range
            end_time: End of time range
            flight_type: 'departures' or 'arrivals'
            
        Returns:
            List of flight dictionaries
        """
        # FlightAware uses ICAO codes (4 letters starting with K for US)
        # Convert IATA to ICAO if needed
        if len(airport_code) == 3:
            airport_code = f"K{airport_code}"
        
        endpoint = f"/airports/{airport_code}/flights/{flight_type}"
        
        # Format times as ISO 8601
        params = {
            "start": start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "end": end_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "max_pages": 5  # Adjust based on how much data you want
        }
        
        print(f"Fetching {flight_type} for {airport_code} from {start_time.date()} to {end_time.date()}")
        
        all_flights = []
        
        # Handle pagination
        while True:
            data = self._make_request(endpoint, params)
            
            
            if not data:
                break
    
            # Different endpoints use different keys
            if flight_type == "departures":
                flights_key = "departures"
            elif flight_type == "arrivals":
                flights_key = "arrivals"
            else:
                flights_key = "flights"  # fallback
    
            if flights_key not in data:
                print(f"  Expected key '{flights_key}' not found in response")
                break
    
            flights = data[flights_key]
            all_flights.extend(flights)
            
            print(f"  Retrieved {len(flights)} flights (total: {len(all_flights)})")
            
            # Check if there are more pages
            if 'links' in data and 'next' in data['links']:
                # Extract cursor for next page
                next_link = data['links']['next']
                # Parse cursor from next link
                if 'cursor' in next_link:
                    params['cursor'] = next_link.split('cursor=')[1].split('&')[0]
                else:
                    break
            else:
                break
        
        return all_flights
    
    def save_raw_flights(self, flights: List[Dict], output_path: Path):
        """
        Save raw flight data to JSON file.
        
        Args:
            flights: List of flight dictionaries from API
            output_path: Where to save the file
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(flights, f, indent=2)
        
        print(f"Saved {len(flights)} flights to {output_path}")