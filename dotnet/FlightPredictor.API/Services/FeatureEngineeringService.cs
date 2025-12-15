using System.Text.Json;

namespace FlightPredictor.API.Services
{
    /// <summary>
    /// Service responsible for transforming raw flight data into the 45 features
    /// that the model expects. This replicates the feature engineering from Python.
    /// 
    /// CRITICAL: This must match your Python preprocessing EXACTLY.
    /// Any deviation will cause incorrect predictions.
    /// </summary>
    public class FeatureEngineeringService
    {
        private readonly ILogger<FeatureEngineeringService> _logger;
        private readonly LabelEncoders _encoders;
        private readonly FeatureScaler _scaler;
        private readonly List<string> _featureOrder;

        // Classes to represent the JSON structures
        private class LabelEncoders
        {
            public EncoderData Origin { get; set; } = new();
            public EncoderData Dest { get; set; } = new();
            public EncoderData Carrier { get; set; } = new();
        }

        private class EncoderData
        {
            public List<string> Classes { get; set; } = new();
            public int ClassCount { get; set; }
        }

        private class FeatureScaler
        {
            public List<double> Mean { get; set; } = new();
            public List<double> Scale { get; set; } = new();
            public int NFeatures { get; set; }
        }

        private class FeatureInfo
        {
            public List<string> FeatureColumns { get; set; } = new();
            public int NumFeatures { get; set; }
        }

        public FeatureEngineeringService(ILogger<FeatureEngineeringService> logger)
        {
            _logger = logger;
            _encoders = LoadEncoders();
            _scaler = LoadScaler();
            _featureOrder = LoadFeatureOrder();

            _logger.LogInformation("Feature engineering service initialized with {Count} features", _featureOrder.Count);
        }

        /// <summary>
        /// Load label encoders from JSON.
        /// </summary>
        private LabelEncoders LoadEncoders()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "Data", "label_encoders.json");
            
            if (!File.Exists(path))
            {
                throw new FileNotFoundException($"Label encoders not found at: {path}");
            }

            var json = File.ReadAllText(path);
            var jsonDoc = JsonDocument.Parse(json);
            var root = jsonDoc.RootElement;

            return new LabelEncoders
            {
                Origin = ParseEncoder(root, "origin"),
                Dest = ParseEncoder(root, "dest"),
                Carrier = ParseEncoder(root, "carrier")
            };
        }

        private EncoderData ParseEncoder(JsonElement root, string key)
        {
            var element = root.GetProperty(key);
            var classes = element.GetProperty("classes").EnumerateArray()
                .Select(x => x.GetString() ?? "")
                .ToList();

            return new EncoderData
            {
                Classes = classes,
                ClassCount = element.GetProperty("class_count").GetInt32()
            };
        }

        /// <summary>
        /// Load feature scaler from JSON.
        /// </summary>
        private FeatureScaler LoadScaler()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "Data", "feature_scaler.json");
            
            if (!File.Exists(path))
            {
                throw new FileNotFoundException($"Feature scaler not found at: {path}");
            }

            var json = File.ReadAllText(path);
            var jsonDoc = JsonDocument.Parse(json);
            var root = jsonDoc.RootElement;

            return new FeatureScaler
            {
                Mean = root.GetProperty("mean").EnumerateArray()
                    .Select(x => x.GetDouble()).ToList(),
                Scale = root.GetProperty("scale").EnumerateArray()
                    .Select(x => x.GetDouble()).ToList(),
                NFeatures = root.GetProperty("n_features").GetInt32()
            };
        }

        /// <summary>
        /// Load feature order from JSON.
        /// </summary>
        private List<string> LoadFeatureOrder()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "Data", "feature_info.json");
            
            if (!File.Exists(path))
            {
                throw new FileNotFoundException($"Feature info not found at: {path}");
            }

            var json = File.ReadAllText(path);
            var jsonDoc = JsonDocument.Parse(json);
            var root = jsonDoc.RootElement;

            return root.GetProperty("feature_columns").EnumerateArray()
                .Select(x => x.GetString() ?? "")
                .ToList();
        }

        /// <summary>
        /// Transform raw flight data into the 45 features the model expects.
        /// This is the main entry point for feature engineering.
        /// </summary>
        public float[] TransformFeatures(RawFlightData data)
        {
            // Create dictionary to hold features by name
            // Why dictionary? Makes it easier to ensure we get the order right
            var features = new Dictionary<string, double>();

            // 1. Temporal features (20 features)
            CreateTemporalFeatures(data, features);

            // 2. Geographic features (3 features)
            CreateGeographicFeatures(data, features);

            // 3. Airline features (1 feature)
            CreateAirlineFeatures(data, features);

            // 4. Historical features (6 features)
            CreateHistoricalFeatures(data, features);

            // 5. Flight characteristics (1 feature)
            CreateFlightCharacteristics(data, features);

            // 6. Weather features (14 features)
            CreateWeatherFeatures(data, features);

            // Verify we have all 45 features
            if (features.Count != 45)
            {
                throw new InvalidOperationException(
                    $"Expected 45 features but got {features.Count}. Missing: {string.Join(", ", _featureOrder.Except(features.Keys))}");
            }

            // Convert to array in the correct order
            var orderedFeatures = _featureOrder.Select(name => features[name]).ToArray();

            // Apply StandardScaler (CRITICAL: must match Python exactly)
            var scaledFeatures = ApplyScaler(orderedFeatures);

            return scaledFeatures;
        }

        /// <summary>
        /// Create all 20 temporal features.
        /// Includes raw time values, cyclical encodings, and time-of-day flags.
        /// </summary>
        private void CreateTemporalFeatures(RawFlightData data, Dictionary<string, double> features)
        {
            // Basic temporal features
            features["month"] = data.Month;
            features["day_of_month"] = data.DayOfMonth;
            features["day_of_week"] = data.DayOfWeek;
            features["dep_hour"] = data.DepHour;
            features["dep_minute"] = data.DepMinute;
            features["arr_hour"] = data.ArrHour;

            // Time-of-day flags
            features["is_morning"] = data.DepHour >= 5 && data.DepHour <= 11 ? 1.0 : 0.0;
            features["is_afternoon"] = data.DepHour >= 12 && data.DepHour <= 17 ? 1.0 : 0.0;
            features["is_evening"] = data.DepHour >= 18 && data.DepHour <= 23 ? 1.0 : 0.0;
            features["is_night"] = data.DepHour >= 0 && data.DepHour <= 4 ? 1.0 : 0.0;

            // Rush hour flags
            features["is_morning_rush"] = (data.DepHour >= 6 && data.DepHour <= 9) ? 1.0 : 0.0;
            features["is_evening_rush"] = (data.DepHour >= 16 && data.DepHour <= 19) ? 1.0 : 0.0;

            // Weekend flag
            features["is_weekend"] = (data.DayOfWeek == 6 || data.DayOfWeek == 7) ? 1.0 : 0.0;

            // Holiday season (November-December, roughly Thanksgiving through New Year)
            features["is_holiday_season"] = (data.Month == 11 || data.Month == 12) ? 1.0 : 0.0;

            // Cyclical encodings
            // WHY? Hours are cyclical: 23:00 and 00:00 are close, but numerically far apart
            // Sin/cos encoding captures this circular relationship
            features["hour_sin"] = Math.Sin(2 * Math.PI * data.DepHour / 24.0);
            features["hour_cos"] = Math.Cos(2 * Math.PI * data.DepHour / 24.0);

            features["dow_sin"] = Math.Sin(2 * Math.PI * data.DayOfWeek / 7.0);
            features["dow_cos"] = Math.Cos(2 * Math.PI * data.DayOfWeek / 7.0);

            features["month_sin"] = Math.Sin(2 * Math.PI * (data.Month - 1) / 12.0);
            features["month_cos"] = Math.Cos(2 * Math.PI * (data.Month - 1) / 12.0);
        }

        /// <summary>
        /// Create geographic features: encoded airports and distance.
        /// </summary>
        private void CreateGeographicFeatures(RawFlightData data, Dictionary<string, double> features)
        {
            features["origin_encoded"] = EncodeAirport(data.OriginAirport, _encoders.Origin);
            features["dest_encoded"] = EncodeAirport(data.DestinationAirport, _encoders.Dest);
            features["distance"] = data.Distance;
        }

        /// <summary>
        /// Create airline feature: encoded carrier.
        /// </summary>
        private void CreateAirlineFeatures(RawFlightData data, Dictionary<string, double> features)
        {
            features["carrier_encoded"] = EncodeCarrier(data.Carrier, _encoders.Carrier);
        }

        /// <summary>
        /// Create historical performance features.
        /// </summary>
        private void CreateHistoricalFeatures(RawFlightData data, Dictionary<string, double> features)
        {
            features["origin_delay_rate"] = data.OriginDelayRate;
            features["dest_delay_rate"] = data.DestDelayRate;
            features["carrier_delay_rate"] = data.CarrierDelayRate;
            features["route_delay_rate"] = data.RouteDelayRate;
            features["origin_daily_flights"] = data.OriginDailyFlights;
            features["dest_daily_flights"] = data.DestDailyFlights;
        }

        /// <summary>
        /// Create flight characteristic features.
        /// </summary>
        private void CreateFlightCharacteristics(RawFlightData data, Dictionary<string, double> features)
        {
            features["crs_elapsed_time"] = data.ScheduledElapsedTime;
        }

        /// <summary>
        /// Create weather features (14 total: 7 departure + 7 arrival).
        /// </summary>
        private void CreateWeatherFeatures(RawFlightData data, Dictionary<string, double> features)
        {
            // Departure weather
            features["dep_temp"] = data.DepTemp;
            features["dep_dewpoint"] = data.DepDewpoint;
            features["dep_pressure"] = data.DepPressure;
            features["dep_wind_dir"] = data.DepWindDir;
            features["dep_wind_speed"] = data.DepWindSpeed;
            features["dep_sky_coverage"] = data.DepSkyCoverage;
            features["dep_precip"] = data.DepPrecip;

            // Arrival weather
            features["arr_temp"] = data.ArrTemp;
            features["arr_dewpoint"] = data.ArrDewpoint;
            features["arr_pressure"] = data.ArrPressure;
            features["arr_wind_dir"] = data.ArrWindDir;
            features["arr_wind_speed"] = data.ArrWindSpeed;
            features["arr_sky_coverage"] = data.ArrSkyCoverage;
            features["arr_precip"] = data.ArrPrecip;
        }

        /// <summary>
        /// Encode an airport code to its integer representation.
        /// MUST match the exact encoding from training.
        /// </summary>
        private double EncodeAirport(string airportCode, EncoderData encoder)
        {
            var index = encoder.Classes.IndexOf(airportCode);
            
            if (index == -1)
            {
                _logger.LogWarning("Unknown airport code: {Code}. Using default encoding 0.", airportCode);
                return 0; // Fallback - this will likely give poor predictions
            }

            return index;
        }

        /// <summary>
        /// Encode a carrier code to its integer representation.
        /// </summary>
        private double EncodeCarrier(string carrierCode, EncoderData encoder)
        {
            var index = encoder.Classes.IndexOf(carrierCode);
            
            if (index == -1)
            {
                _logger.LogWarning("Unknown carrier code: {Code}. Using default encoding 0.", carrierCode);
                return 0;
            }

            return index;
        }

        /// <summary>
        /// Apply StandardScaler to features.
        /// Formula: (x - mean) / std
        /// 
        /// CRITICAL: Must use the SAME mean/std from training.
        /// </summary>
        private float[] ApplyScaler(double[] features)
        {
            if (features.Length != _scaler.NFeatures)
            {
                throw new InvalidOperationException(
                    $"Feature count mismatch. Expected {_scaler.NFeatures}, got {features.Length}");
            }

            var scaled = new float[features.Length];

            for (int i = 0; i < features.Length; i++)
            {
                // StandardScaler formula: (x - mean) / std
                scaled[i] = (float)((features[i] - _scaler.Mean[i]) / _scaler.Scale[i]);
            }

            return scaled;
        }

        /// <summary>
        /// Data class to hold all raw flight data needed for feature engineering.
        /// This is what ModelService will pass to this service.
        /// </summary>
        public class RawFlightData
        {
            // Temporal
            public int Month { get; set; }
            public int DayOfMonth { get; set; }
            public int DayOfWeek { get; set; }
            public int DepHour { get; set; }
            public int DepMinute { get; set; }
            public int ArrHour { get; set; }

            // Geographic
            public string OriginAirport { get; set; } = string.Empty;
            public string DestinationAirport { get; set; } = string.Empty;
            public double Distance { get; set; }

            // Airline
            public string Carrier { get; set; } = string.Empty;

            // Historical
            public double OriginDelayRate { get; set; }
            public double DestDelayRate { get; set; }
            public double CarrierDelayRate { get; set; }
            public double RouteDelayRate { get; set; }
            public int OriginDailyFlights { get; set; }
            public int DestDailyFlights { get; set; }

            // Flight characteristics
            public double ScheduledElapsedTime { get; set; }

            // Weather
            public double DepTemp { get; set; }
            public double DepDewpoint { get; set; }
            public double DepPressure { get; set; }
            public double DepWindDir { get; set; }
            public double DepWindSpeed { get; set; }
            public double DepSkyCoverage { get; set; }
            public double DepPrecip { get; set; }

            public double ArrTemp { get; set; }
            public double ArrDewpoint { get; set; }
            public double ArrPressure { get; set; }
            public double ArrWindDir { get; set; }
            public double ArrWindSpeed { get; set; }
            public double ArrSkyCoverage { get; set; }
            public double ArrPrecip { get; set; }
        }
    }
}