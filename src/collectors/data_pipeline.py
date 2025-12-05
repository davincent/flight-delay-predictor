# src/collectors/data_pipeline.py
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict
from pathlib import Path

from src.collectors.flightaware_client import FlightAwareClient
from src.collectors.ncdc_client import NCDCClient

class FlightDataCollector:
    """
    Main data collection pipeline that combines flights and weather.
    """
    
    def __init__(self, flightaware_key: str, ncdc_token: str,
                 flightaware_rate_limit: float = 0.1,
                 ncdc_rate_limit: float = 0.2):
        """
        Initialize the data collector with both API clients.
        
        Args:
            flightaware_key: FlightAware API key
            ncdc_token: NCDC API token
            flightaware_rate_limit: Rate limit for FlightAware
            ncdc_rate_limit: Rate limit for NCDC
        """
        self.flight_client = FlightAwareClient(flightaware_key, flightaware_rate_limit)
        self.weather_client = NCDCClient(ncdc_token, ncdc_rate_limit)
    
    def collect_flights_and_weather(self, 
                                    airports: List[str],
                                    start_date: datetime,
                                    end_date: datetime,
                                    output_dir: Path) -> pd.DataFrame:
        """
        Collect flight and weather data for specified airports and date range.
        
        This is the main collection method that:
        1. Fetches flights for each airport
        2. Fetches weather for each unique airport-date combination
        3. Merges the data
        4. Saves raw data for audit trail
        
        Args:
            airports: List of airport codes to collect
            start_date: Start of collection period
            end_date: End of collection period
            output_dir: Where to save raw data
            
        Returns:
            DataFrame with combined flight and weather data
        """
        all_flights = []
        
        # Step 1: Collect flights for each airport
        print("\n=== Collecting Flight Data ===")
        for airport in airports:
            flights = self.flight_client.get_airport_flights(
                airport_code=airport,
                start_time=start_date,
                end_time=end_date,
                flight_type="departures"
            )
            
            all_flights.extend(flights)
        
        if not all_flights:
            print("No flights collected!")
            return pd.DataFrame()
        
        # Save raw flight data
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.flight_client.save_raw_flights(
            all_flights,
            output_dir / 'raw' / 'flights' / f'flights_{timestamp}.json'
        )
        
        # Step 2: Convert flights to DataFrame
        print("\n=== Processing Flight Data ===")
        flights_df = self._parse_flights_to_dataframe(all_flights)
        print(f"Parsed {len(flights_df)} flight records")
        
        # Step 3: Collect weather data
        print("\n=== Collecting Weather Data ===")
        weather_records = self._collect_weather_for_flights(flights_df)
        
        # Save raw weather data
        self.weather_client.save_raw_weather(
            weather_records,
            output_dir / 'raw' / 'weather' / f'weather_{timestamp}.json'
        )
        
        # Step 4: Merge flight and weather data
        print("\n=== Merging Data ===")
        combined_df = self._merge_flight_weather(flights_df, weather_records)
        
        print(f"Final dataset: {len(combined_df)} records with {len(combined_df.columns)} columns")
        
        return combined_df
    
    def _parse_flights_to_dataframe(self, flights: List[dict]) -> pd.DataFrame:
        """
        Parse raw FlightAware API responses into a structured DataFrame.
        
        Args:
            flights: List of flight dictionaries from API
            
        Returns:
            DataFrame with standardized flight information
        """
        records = []
        
        for flight in flights:
            # Extract relevant fields from FlightAware response
            record = {
                # Flight identifiers
                'flight_id': flight.get('fa_flight_id', ''),
                'ident': flight.get('ident', ''),
                'operator': flight.get('operator', ''),
                'operator_iata': flight.get('operator_iata', ''),
                
                # Airports
                'origin': flight.get('origin', {}).get('code_iata', ''),
                'destination': flight.get('destination', {}).get('code_iata', ''),
                
                # Scheduled times
                'scheduled_departure': flight.get('scheduled_out', ''),
                'scheduled_arrival': flight.get('scheduled_in', ''),
                
                # Actual times (may be null for future flights)
                'actual_departure': flight.get('actual_out', ''),
                'actual_arrival': flight.get('actual_in', ''),
                
                # Status
                'status': flight.get('status', ''),
                'cancelled': flight.get('cancelled', False),
                'diverted': flight.get('diverted', False),
            }
            
            records.append(record)
        
        df = pd.DataFrame(records)
        
        # Convert time strings to datetime objects
        time_columns = ['scheduled_departure', 'scheduled_arrival', 
                       'actual_departure', 'actual_arrival']
        for col in time_columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Calculate delays in minutes
        df['departure_delay'] = (
            (df['actual_departure'] - df['scheduled_departure']).dt.total_seconds() / 60
        )
        df['arrival_delay'] = (
            (df['actual_arrival'] - df['scheduled_arrival']).dt.total_seconds() / 60
        )
        
        # Filter out flights that haven't happened yet (no actual times)
        df = df[df['actual_arrival'].notna()].copy()
        
        return df
    
    def _collect_weather_for_flights(self, flights_df: pd.DataFrame) -> List[Dict]:
        """
        Collect weather data for all unique airport-date combinations in flights.
        
        This optimizes API calls by only fetching weather once per airport-date pair.
        
        Args:
            flights_df: DataFrame of flights
            
        Returns:
            List of weather dictionaries
        """
        # Find unique airport-date combinations
        flights_df['departure_date'] = flights_df['scheduled_departure'].dt.date
        unique_combos = flights_df[['origin', 'departure_date']].drop_duplicates()
        
        print(f"Fetching weather for {len(unique_combos)} unique airport-date combinations")
        
        weather_records = []
        
        for _, row in unique_combos.iterrows():
            airport = row['origin']
            date = pd.to_datetime(row['departure_date'])
            
            weather = self.weather_client.get_weather_for_airport(airport, date)
            
            if weather:
                weather['date'] = row['departure_date']
                weather_records.append(weather)
        
        print(f"Collected weather data for {len(weather_records)} airport-date pairs")
        
        return weather_records
    
    def _merge_flight_weather(self, flights_df: pd.DataFrame, 
                             weather_records: List[Dict]) -> pd.DataFrame:
        """
        Merge flight data with weather data.
        
        Args:
            flights_df: DataFrame of flights
            weather_records: List of weather dictionaries
            
        Returns:
            Merged DataFrame
        """
        # Convert weather to DataFrame
        weather_df = pd.DataFrame(weather_records)
        
        if weather_df.empty:
            print("Warning: No weather data to merge")
            return flights_df
        
        # Add departure date to flights for merging
        flights_df['departure_date'] = flights_df['scheduled_departure'].dt.date
        
        # Rename weather columns to avoid conflicts
        weather_df = weather_df.rename(columns={'airport': 'origin'})
        
        # Merge on origin airport and date
        merged_df = flights_df.merge(
            weather_df,
            on=['origin', 'departure_date'],
            how='left'
        )
        
        print(f"Merged dataset has {len(merged_df)} records")
        print(f"Records with weather data: {merged_df['station_id'].notna().sum()}")
        
        return merged_df