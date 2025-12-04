# src/preprocessing/feature_engineering.py
import pandas as pd
import numpy as np
from typing import Tuple
from sklearn.preprocessing import LabelEncoder, StandardScaler
import pickle
from pathlib import Path

class FeatureEngineer:
    """
    Feature engineering for flight delay prediction using real-time data.
    """
    
    def __init__(self, models_dir: Path = Path('data/models')):
        """
        Initialize feature engineer.
        
        Args:
            models_dir: Directory to save/load encoders and scalers
        """
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        self.carrier_encoder = LabelEncoder()
        self.origin_encoder = LabelEncoder()
        self.destination_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        
        self.is_fitted = False
    
    def create_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create features from datetime information.
        
        Temporal patterns are crucial for flight delays:
        - Day of week (Fridays/Sundays have more delays)
        - Month (winter weather affects delays)
        - Hour (evening flights accumulate delays)
        
        Args:
            df: DataFrame with 'scheduled_departure' column
            
        Returns:
            DataFrame with added temporal features
        """
        df = df.copy()
        
        # Extract basic time components
        df['day_of_week'] = df['scheduled_departure'].dt.dayofweek  # 0=Monday, 6=Sunday
        df['month'] = df['scheduled_departure'].dt.month
        df['hour'] = df['scheduled_departure'].dt.hour
        df['day_of_month'] = df['scheduled_departure'].dt.day
        
        # Cyclical encoding: Map circular time (0-6 days, 0-23 hours) to sine/cosine
        # This ensures the model understands that Monday and Sunday are adjacent
        df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        df['month_sin'] = np.sin(2 * np.pi * (df['month'] - 1) / 12)
        df['month_cos'] = np.cos(2 * np.pi * (df['month'] - 1) / 12)
        
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        
        # Binary features
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        df['is_morning'] = ((df['hour'] >= 6) & (df['hour'] < 12)).astype(int)
        df['is_evening'] = ((df['hour'] >= 18) & (df['hour'] < 24)).astype(int)
        
        return df
    
    def create_weather_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create features from weather data.
        
        Weather significantly impacts delays through:
        - Precipitation (rain/snow reduces visibility)
        - Temperature extremes (icing, overheating issues)
        - Wind speed (affects takeoff/landing safety)
        
        Args:
            df: DataFrame with weather columns (PRCP, TMAX, TMIN, AWND, etc.)
            
        Returns:
            DataFrame with processed weather features
        """
        df = df.copy()
        
        # Precipitation (tenths of mm in GHCND, convert to inches)
        df['precipitation'] = df['PRCP'].fillna(0) / 254.0  # Convert to inches
        df['has_precipitation'] = (df['precipitation'] > 0).astype(int)
        
        # Temperature (tenths of degrees Celsius in GHCND)
        df['temp_max'] = df['TMAX'].fillna(df['TMAX'].median()) / 10.0
        df['temp_min'] = df['TMIN'].fillna(df['TMIN'].median()) / 10.0
        df['temp_range'] = df['temp_max'] - df['temp_min']
        
        # Average temperature (useful for extreme cold/heat)
        df['temp_avg'] = (df['temp_max'] + df['temp_min']) / 2
        
        # Wind speed (tenths of m/s in GHCND)
        df['wind_speed'] = df['AWND'].fillna(0) / 10.0
        df['high_wind'] = (df['wind_speed'] > 10).astype(int)  # >10 m/s is significant
        
        # Snow depth and snowfall
        df['snow_depth'] = df.get('SNWD', pd.Series(0)).fillna(0) / 10.0  # mm to cm
        df['snowfall'] = df.get('SNOW', pd.Series(0)).fillna(0) / 10.0
        df['has_snow'] = (df['snow_depth'] > 0).astype(int)
        
        # Extreme weather indicators
        df['extreme_cold'] = (df['temp_min'] < -10).astype(int)  # Below -10°C
        df['extreme_heat'] = (df['temp_max'] > 35).astype(int)   # Above 35°C
        
        return df
    
    def create_categorical_features(self, df: pd.DataFrame, 
                                   fit: bool = False) -> pd.DataFrame:
        """
        Encode categorical variables.
        
        Args:
            df: DataFrame with 'operator_iata', 'origin', 'destination'
            fit: If True, fit encoders on this data. If False, use existing encoders.
            
        Returns:
            DataFrame with encoded categorical features
        """
        df = df.copy()
        
        # Handle missing values
        df['operator_iata'] = df['operator_iata'].fillna('UNKNOWN')
        df['origin'] = df['origin'].fillna('UNKNOWN')
        df['destination'] = df['destination'].fillna('UNKNOWN')
        
        if fit:
            # Fit encoders on the data
            df['carrier_encoded'] = self.carrier_encoder.fit_transform(df['operator_iata'])
            df['origin_encoded'] = self.origin_encoder.fit_transform(df['origin'])
            df['destination_encoded'] = self.destination_encoder.fit_transform(df['destination'])
            
            # Save encoders
            with open(self.models_dir / 'carrier_encoder.pkl', 'wb') as f:
                pickle.dump(self.carrier_encoder, f)
            with open(self.models_dir / 'origin_encoder.pkl', 'wb') as f:
                pickle.dump(self.origin_encoder, f)
            with open(self.models_dir / 'destination_encoder.pkl', 'wb') as f:
                pickle.dump(self.destination_encoder, f)
        else:
            # Use existing encoders, handle unknown categories
            df['carrier_encoded'] = df['operator_iata'].apply(
                lambda x: self.carrier_encoder.transform([x])[0] 
                if x in self.carrier_encoder.classes_ else -1
            )
            df['origin_encoded'] = df['origin'].apply(
                lambda x: self.origin_encoder.transform([x])[0]
                if x in self.origin_encoder.classes_ else -1
            )
            df['destination_encoded'] = df['destination'].apply(
                lambda x: self.destination_encoder.transform([x])[0]
                if x in self.destination_encoder.classes_ else -1
            )
        
        return df
    
    def create_target(self, df: pd.DataFrame, threshold: float = 15.0) -> pd.DataFrame:
        """
        Create binary target variable for delay prediction.
        
        A flight is considered "delayed" if arrival delay exceeds threshold minutes.
        
        Args:
            df: DataFrame with 'arrival_delay' column
            threshold: Minutes of delay to classify as "delayed"
            
        Returns:
            DataFrame with 'is_delayed' target column
        """
        df = df.copy()
        
        # Binary classification: delayed (1) or on-time (0)
        df['is_delayed'] = (df['arrival_delay'] > threshold).astype(int)
        
        # Also keep the continuous delay for potential regression
        df['arrival_delay_minutes'] = df['arrival_delay'].fillna(0)
        
        return df
    
    def transform(self, df: pd.DataFrame, 
                 fit: bool = False,
                 include_target: bool = True) -> pd.DataFrame:
        """
        Apply full feature engineering pipeline.
        
        This is the main method to call. It applies all transformations
        in the correct order.
        
        Args:
            df: Raw DataFrame from data collection
            fit: If True, fit encoders/scalers. Use True for training data only.
            include_target: If True, create target variable
            
        Returns:
            Fully engineered DataFrame ready for modeling
        """
        print("Applying feature engineering...")
        
        df = df.copy()
        
        # Apply all feature creation steps
        df = self.create_temporal_features(df)
        df = self.create_weather_features(df)
        df = self.create_categorical_features(df, fit=fit)
        
        if include_target:
            df = self.create_target(df)
        
        # Define feature columns for scaling
        feature_cols = [
            # Temporal features (cyclical)
            'day_of_week_sin', 'day_of_week_cos',
            'month_sin', 'month_cos',
            'hour_sin', 'hour_cos',
            'is_weekend', 'is_morning', 'is_evening',
            
            # Categorical encodings
            'carrier_encoded', 'origin_encoded', 'destination_encoded',
            
            # Weather features
            'precipitation', 'has_precipitation',
            'temp_avg', 'temp_range',
            'wind_speed', 'high_wind',
            'snow_depth', 'has_snow',
            'extreme_cold', 'extreme_heat',
        ]
        
        # Ensure all feature columns exist
        missing_cols = [col for col in feature_cols if col not in df.columns]
        if missing_cols:
            print(f"Warning: Missing columns: {missing_cols}")
            feature_cols = [col for col in feature_cols if col in df.columns]
        
        # Apply scaling
        if fit:
            df[feature_cols] = self.scaler.fit_transform(df[feature_cols])
            
            # Save scaler
            with open(self.models_dir / 'feature_scaler.pkl', 'wb') as f:
                pickle.dump(self.scaler, f)
            
            # Save feature column names for consistency
            with open(self.models_dir / 'feature_columns.pkl', 'wb') as f:
                pickle.dump(feature_cols, f)
            
            self.is_fitted = True
        else:
            if not self.is_fitted:
                raise ValueError("Scaler not fitted. Call transform with fit=True first.")
            df[feature_cols] = self.scaler.transform(df[feature_cols])
        
        # Select only the features we need
        if include_target:
            output_cols = feature_cols + ['is_delayed', 'arrival_delay_minutes']
        else:
            output_cols = feature_cols
        
        # Add some metadata columns for reference
        metadata_cols = ['flight_id', 'ident', 'origin', 'destination', 
                        'scheduled_departure', 'scheduled_arrival']
        metadata_cols = [col for col in metadata_cols if col in df.columns]
        
        output_df = df[metadata_cols + output_cols].copy()
        
        print(f"Feature engineering complete: {len(output_df)} records, {len(output_cols)} features")
        
        return output_df