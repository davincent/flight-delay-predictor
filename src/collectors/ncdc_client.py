import requests
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import json
from pathlib import Path

class NCDCClient:
    """
    Client for NOAA's National Climatic Data Center (NCDC) API.
    
    Provides historical weather observations from weather stations
    across the United States.
    """
    
    def __init__(self, token: str, rate_limit: float = 0.2):
        """
        Initialize NCDC client.
        
        Args:
            token: Your NCDC API token
            rate_limit: Minimum seconds between requests (NCDC limit: 5/sec)
        """
        self.token = token
        self.base_url = "https://www.ncei.noaa.gov/cdo-web/api/v2"
        self.rate_limit = rate_limit
        self.last_request_time = 0
        
        self.headers = {
            "token": token
        }
        
        # Cache for airport coordinates and nearest stations
        self.airport_coords_cache = {}
        self.station_cache = {}
    
    def _rate_limit_wait(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit:
            time.sleep(self.rate_limit - elapsed)
        self.last_request_time = time.time()
    
    def _make_request(self, endpoint: str, params: Dict) -> Optional[Dict]:
        """
        Make a rate-limited request to NCDC API.
        
        Args:
            endpoint: API endpoint (e.g., '/stations')
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
                print("Rate limited on NCDC. Waiting 60 seconds...")
                time.sleep(60)
                return self._make_request(endpoint, params)
            else:
                print(f"NCDC API error {response.status_code}: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"NCDC request failed: {e}")
            return None
    
    def get_airport_coordinates(self, airport_code: str) -> Optional[Dict[str, float]]:
        """
        Get latitude/longitude for an airport.
        
        This is a simplified lookup. In production, you'd use a proper
        airport database or the FlightAware airport endpoint.
        
        Args:
            airport_code: IATA airport code
            
        Returns:
            Dict with 'lat' and 'lon' keys
        """
        # Check cache first
        if airport_code in self.airport_coords_cache:
            return self.airport_coords_cache[airport_code]
        
        # Major airport coordinates (expand this as needed)
        # In production, use a proper airport database
        coords = {
            'ATL': {'lat': 33.6407, 'lon': -84.4277},
            'ORD': {'lat': 41.9742, 'lon': -87.9073},
            'DFW': {'lat': 32.8998, 'lon': -97.0403},
            'DEN': {'lat': 39.8561, 'lon': -104.6737},
            'LAX': {'lat': 33.9416, 'lon': -118.4085},
            'JFK': {'lat': 40.6413, 'lon': -73.7781},
            'SFO': {'lat': 37.6213, 'lon': -122.3790},
            'LAS': {'lat': 36.0840, 'lon': -115.1537},
            'MCO': {'lat': 28.4312, 'lon': -81.3081},
            'PHX': {'lat': 33.4352, 'lon': -112.0101},
        }
        
        if airport_code in coords:
            self.airport_coords_cache[airport_code] = coords[airport_code]
            return coords[airport_code]
        
        print(f"Warning: Coordinates not found for {airport_code}")
        return None
    
    def find_nearest_station(self, latitude: float, longitude: float, 
                            date: datetime) -> Optional[str]:
        """
        Find the nearest weather station to a location.
        
        Args:
            latitude: Latitude of location
            longitude: Longitude of location
            date: Date for which we need weather data
            
        Returns:
            Station ID string, or None if no station found
        """
        cache_key = f"{latitude:.2f},{longitude:.2f}"
        
        if cache_key in self.station_cache:
            return self.station_cache[cache_key]
        
        # Search for stations within ~50km (0.5 degrees)
        extent = f"{latitude-0.5},{longitude-0.5},{latitude+0.5},{longitude+0.5}"
        
        params = {
            'extent': extent,
            'datasetid': 'GHCND',  # Global Historical Climatology Network Daily
            'limit': 10,
            'startdate': date.strftime('%Y-%m-%d'),
            'enddate': date.strftime('%Y-%m-%d')
        }
        
        data = self._make_request('/stations', params)
        
        if not data or 'results' not in data or len(data['results']) == 0:
            print(f"No weather stations found near {latitude}, {longitude}")
            return None
        
        # Use the first (closest) station
        station_id = data['results'][0]['id']
        self.station_cache[cache_key] = station_id
        
        return station_id
    
    def get_weather_data(self, station_id: str, date: datetime) -> Dict:
        """
        Get weather observations from a station for a specific date.
        
        Args:
            station_id: NCDC station identifier
            date: Date to retrieve weather for
            
        Returns:
            Dictionary with weather metrics
        """
        date_str = date.strftime('%Y-%m-%d')
        
        # Request multiple data types at once
        # PRCP: Precipitation, TMAX/TMIN: Temperature, AWND: Wind speed
        params = {
            'datasetid': 'GHCND',
            'stationid': station_id,
            'startdate': date_str,
            'enddate': date_str,
            'datatypeid': 'PRCP,TMAX,TMIN,AWND,SNOW,SNWD',
            'units': 'standard',  # Fahrenheit, inches, mph
            'limit': 1000
        }
        
        data = self._make_request('/data', params)
        
        if not data or 'results' not in data:
            return {}
        
        # Parse observations into a dict
        weather = {}
        for obs in data['results']:
            datatype = obs['datatype']
            value = obs['value']
            weather[datatype] = value
        
        return weather
    
    def get_weather_for_airport(self, airport_code: str, 
                                date: datetime) -> Optional[Dict]:
        """
        Get weather data for an airport on a specific date.
        
        This combines coordinate lookup, station finding, and data retrieval.
        
        Args:
            airport_code: IATA airport code
            date: Date to get weather for
            
        Returns:
            Dictionary with weather data, or None if unavailable
        """
        # Get airport coordinates
        coords = self.get_airport_coordinates(airport_code)
        if not coords:
            return None
        
        # Find nearest weather station
        station_id = self.find_nearest_station(
            coords['lat'], coords['lon'], date
        )
        if not station_id:
            return None
        
        # Get weather data
        weather = self.get_weather_data(station_id, date)
        
        # Add airport and station info for reference
        weather['airport'] = airport_code
        weather['station_id'] = station_id
        weather['latitude'] = coords['lat']
        weather['longitude'] = coords['lon']
        
        return weather
    
    def save_raw_weather(self, weather_data: List[Dict], output_path: Path):
        """
        Save raw weather data to JSON file.
        
        Args:
            weather_data: List of weather dictionaries
            output_path: Where to save the file
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(weather_data, f, indent=2)
        
        print(f"Saved weather data for {len(weather_data)} records to {output_path}")