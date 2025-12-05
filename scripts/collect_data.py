# scripts/collect_data.py
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from datetime import datetime, timedelta
from src.utils.config import APIConfig, CollectionConfig
from src.collectors.data_pipeline import FlightDataCollector
from src.preprocessing.feature_engineering import FeatureEngineer

def main():
    """
    Main data collection script.
    
    This script:
    1. Collects flight data from FlightAware
    2. Collects weather data from NCDC
    3. Merges the datasets
    4. Applies feature engineering
    5. Saves processed data for model training
    """
    print("=" * 60)
    print("FLIGHT DELAY PREDICTOR - DATA COLLECTION")
    print("=" * 60)
    print(f"Started at: {datetime.now()}\n")
    
    # Load configuration
    try:
        api_config = APIConfig.from_env()
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("\nCreate a .env file in the project root with:")
        print("FLIGHTAWARE_API_KEY=your_key_here")
        print("NCDC_API_TOKEN=your_token_here")
        return
    
    # Configure collection parameters
    collection_config = CollectionConfig(
        airports=['ATL', 'ORD', 'DFW', 'DEN', 'LAX'],  # Top 5 US airports
        lookback_days=2,  # Collect last 2 days of data
    )
    
    # Initialize collector
    collector = FlightDataCollector(
        flightaware_key=api_config.flightaware_key,
        ncdc_token=api_config.ncdc_token,
        flightaware_rate_limit=collection_config.flightaware_rate_limit,
        ncdc_rate_limit=collection_config.ncdc_rate_limit
    )
    
    # Calculate date range
    end_date = datetime.now() - timedelta(days=4)
    start_date = datetime.now() - timedelta(days=7)
    
    print(f"Collection parameters:")
    print(f"  Airports: {', '.join(collection_config.airports)}")
    print(f"  Date range: {start_date.date()} to {end_date.date()}")
    print(f"  Output: {collection_config.output_dir}\n")
    
    # Collect data
    combined_df = collector.collect_flights_and_weather(
        airports=collection_config.airports,
        start_date=start_date,
        end_date=end_date,
        output_dir=collection_config.output_dir
    )
    
    if combined_df.empty:
        print("No data collected. Exiting.")
        return
    
    # Apply feature engineering
    engineer = FeatureEngineer()
    
    # First collection: fit the encoders and scaler
    processed_df = engineer.transform(combined_df, fit=True, include_target=True)
    
    # Save processed data
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_path = collection_config.output_dir / 'processed' / f'features_{timestamp}.csv'
    processed_df.to_csv(output_path, index=False)
    
    print(f"\n{'=' * 60}")
    print(f"COLLECTION COMPLETE")
    print(f"{'=' * 60}")
    print(f"Total records: {len(processed_df)}")
    print(f"Delayed flights: {processed_df['is_delayed'].sum()} ({processed_df['is_delayed'].mean()*100:.1f}%)")
    print(f"Features: {len([col for col in processed_df.columns if col not in ['is_delayed', 'arrival_delay_minutes', 'flight_id', 'ident', 'origin', 'destination', 'scheduled_departure', 'scheduled_arrival']])}")
    print(f"Saved to: {output_path}")
    print(f"Finished at: {datetime.now()}")

if __name__ == '__main__':
    main()