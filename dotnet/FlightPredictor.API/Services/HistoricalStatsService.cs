using System.Text.Json;

namespace FlightPredictor.API.Services
{
    /// <summary>
    /// Service for historical flight performance statistics.
    /// These statistics are calculated from training data and used as model features.
    /// 
    /// IMPORTANT: These stats are "frozen" from training time and should only be updated
    /// when you retrain the model with new data.
    /// </summary>
    public class HistoricalStatsService
    {
        private readonly ILogger<HistoricalStatsService> _logger;
        private readonly HistoricalStats _stats;

        // Inner classes to represent the JSON structure
        public class HistoricalStats
        {
            public Dictionary<string, double> OriginDelayRate { get; set; } = new();
            public Dictionary<string, double> DestDelayRate { get; set; } = new();
            public Dictionary<string, double> CarrierDelayRate { get; set; } = new();
            public Dictionary<string, double> RouteDelayRate { get; set; } = new();
            public Dictionary<string, int> OriginDailyFlights { get; set; } = new();
            public Dictionary<string, int> DestDailyFlights { get; set; } = new();
            public StatsMetadata? Metadata { get; set; }
        }

        public class StatsMetadata
        {
            public string GeneratedDate { get; set; } = string.Empty;
            public int TotalFlights { get; set; }
            public double OverallDelayRate { get; set; }
        }

        public HistoricalStatsService(ILogger<HistoricalStatsService> logger)
        {
            _logger = logger;
            _stats = LoadStats();
        }

        /// <summary>
        /// Load historical statistics from JSON file.
        /// </summary>
        private HistoricalStats LoadStats()
        {
            var statsPath = Path.Combine(AppContext.BaseDirectory, "Data", "historical_stats.json");

            if (!File.Exists(statsPath))
            {
                throw new FileNotFoundException($"Historical stats file not found at: {statsPath}");
            }

            _logger.LogInformation("Loading historical statistics from {Path}", statsPath);

            var jsonString = File.ReadAllText(statsPath);
            
            // Parse the JSON structure
            // Your Python script exports: { "metadata": {...}, "origin_delay_rate": {...}, ... }
            var jsonDoc = JsonDocument.Parse(jsonString);
            var root = jsonDoc.RootElement;

            var stats = new HistoricalStats();

            // Load metadata
            if (root.TryGetProperty("metadata", out var metadataElement))
            {
                stats.Metadata = new StatsMetadata
                {
                    GeneratedDate = metadataElement.GetProperty("generated_date").GetString() ?? "",
                    TotalFlights = metadataElement.GetProperty("total_flights").GetInt32(),
                    OverallDelayRate = metadataElement.GetProperty("overall_delay_rate").GetDouble()
                };
            }

            // Load delay rates and volumes
            // Note: JSON property names use snake_case from Python
            stats.OriginDelayRate = ParseDictionary<double>(root, "origin_delay_rate");
            stats.DestDelayRate = ParseDictionary<double>(root, "dest_delay_rate");
            stats.CarrierDelayRate = ParseDictionary<double>(root, "carrier_delay_rate");
            stats.RouteDelayRate = ParseDictionary<double>(root, "route_delay_rate");
            stats.OriginDailyFlights = ParseDictionary<int>(root, "origin_daily_flights");
            stats.DestDailyFlights = ParseDictionary<int>(root, "dest_daily_flights");

            _logger.LogInformation(
                "✓ Loaded statistics: {OriginCount} origins, {CarrierCount} carriers, {RouteCount} routes",
                stats.OriginDelayRate.Count,
                stats.CarrierDelayRate.Count,
                stats.RouteDelayRate.Count
            );

            if (stats.Metadata != null)
            {
                _logger.LogInformation(
                    "Stats generated on {Date} from {Flights:N0} flights (overall delay rate: {Rate:P1})",
                    stats.Metadata.GeneratedDate,
                    stats.Metadata.TotalFlights,
                    stats.Metadata.OverallDelayRate
                );
            }

            return stats;
        }

        /// <summary>
        /// Helper method to parse a dictionary from JSON.
        /// Generic to handle both double (delay rates) and int (flight volumes).
        /// </summary>
        private Dictionary<string, T> ParseDictionary<T>(JsonElement root, string propertyName)
        {
            var dict = new Dictionary<string, T>(StringComparer.OrdinalIgnoreCase);

            if (root.TryGetProperty(propertyName, out var element))
            {
                foreach (var prop in element.EnumerateObject())
                {
                    T value;
                    if (typeof(T) == typeof(double))
                    {
                        value = (T)(object)prop.Value.GetDouble();
                    }
                    else if (typeof(T) == typeof(int))
                    {
                        value = (T)(object)prop.Value.GetInt32();
                    }
                    else
                    {
                        throw new NotSupportedException($"Type {typeof(T)} not supported");
                    }

                    dict[prop.Name] = value;
                }
            }

            return dict;
        }

        /// <summary>
        /// Get delay rate for an origin airport.
        /// Returns overall average if airport not found (unknown airports get average performance).
        /// </summary>
        public double GetOriginDelayRate(string airportCode)
        {
            if (_stats.OriginDelayRate.TryGetValue(airportCode, out var rate))
            {
                return rate;
            }

            // Fallback to overall average for unknown airports
            _logger.LogDebug("Unknown origin airport {Code}, using overall average", airportCode);
            return _stats.Metadata?.OverallDelayRate ?? 0.20; // Default 20% if no metadata
        }

        /// <summary>
        /// Get delay rate for a destination airport.
        /// </summary>
        public double GetDestDelayRate(string airportCode)
        {
            if (_stats.DestDelayRate.TryGetValue(airportCode, out var rate))
            {
                return rate;
            }

            _logger.LogDebug("Unknown destination airport {Code}, using overall average", airportCode);
            return _stats.Metadata?.OverallDelayRate ?? 0.20;
        }

        /// <summary>
        /// Get delay rate for a carrier.
        /// </summary>
        public double GetCarrierDelayRate(string carrierCode)
        {
            if (_stats.CarrierDelayRate.TryGetValue(carrierCode, out var rate))
            {
                return rate;
            }

            _logger.LogDebug("Unknown carrier {Code}, using overall average", carrierCode);
            return _stats.Metadata?.OverallDelayRate ?? 0.20;
        }

        /// <summary>
        /// Get delay rate for a specific route (origin-destination pair).
        /// Route format: "ATL_LAX"
        /// </summary>
        public double GetRouteDelayRate(string originCode, string destCode)
        {
            var routeKey = $"{originCode}_{destCode}";

            if (_stats.RouteDelayRate.TryGetValue(routeKey, out var rate))
            {
                return rate;
            }

            // Fallback: average of origin and destination delay rates
            // Why? If we don't have this specific route, using the endpoints gives a reasonable estimate
            var originRate = GetOriginDelayRate(originCode);
            var destRate = GetDestDelayRate(destCode);
            var estimatedRate = (originRate + destRate) / 2.0;

            _logger.LogDebug("Unknown route {Route}, using average of endpoints: {Rate:P1}", 
                routeKey, estimatedRate);

            return estimatedRate;
        }

        /// <summary>
        /// Get daily flight volume for an origin airport.
        /// </summary>
        public int GetOriginDailyFlights(string airportCode)
        {
            if (_stats.OriginDailyFlights.TryGetValue(airportCode, out var volume))
            {
                return volume;
            }

            // Fallback to a reasonable default
            _logger.LogDebug("Unknown origin airport volume for {Code}, using default", airportCode);
            return 100; // Assume moderate traffic if unknown
        }

        /// <summary>
        /// Get daily flight volume for a destination airport.
        /// </summary>
        public int GetDestDailyFlights(string airportCode)
        {
            if (_stats.DestDailyFlights.TryGetValue(airportCode, out var volume))
            {
                return volume;
            }

            _logger.LogDebug("Unknown destination airport volume for {Code}, using default", airportCode);
            return 100;
        }

        /// <summary>
        /// Get metadata about when these statistics were generated.
        /// Useful for health checks and debugging.
        /// </summary>
        public StatsMetadata? GetMetadata() => _stats.Metadata;
    }
}