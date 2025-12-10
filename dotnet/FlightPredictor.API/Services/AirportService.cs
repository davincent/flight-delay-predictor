using System.Globalization;

namespace FlightPredictor.API.Services
{
    /// <summary>
    /// Service for airport lookups and geographic calculations.
    /// Loads airport data once at startup and provides fast in-memory lookups.
    /// </summary>
    public class AirportService
    {
        private readonly Dictionary<string, Airport> _airports;
        private readonly ILogger<AirportService> _logger;

        // Inner class to represent airport data
        public class Airport
        {
            public string IataCode { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public double Latitude { get; set; }
            public double Longitude { get; set; }
            public string Municipality { get; set; } = string.Empty;
        }

        public AirportService(ILogger<AirportService> logger)
        {
            _logger = logger;
            _airports = new Dictionary<string, Airport>(StringComparer.OrdinalIgnoreCase);
            LoadAirports();
        }

        /// <summary>
        /// Load airports from CSV file into memory.
        /// Why in the constructor? We want to fail fast if the file is missing or corrupt.
        /// </summary>
        private void LoadAirports()
        {
            var airportPath = Path.Combine(AppContext.BaseDirectory, "Data", "airports.csv");
            
            if (!File.Exists(airportPath))
            {
                throw new FileNotFoundException($"Airport data file not found at: {airportPath}");
            }

            _logger.LogInformation("Loading airport data from {Path}", airportPath);

            var lines = File.ReadAllLines(airportPath);
            
            // Skip header row (index 0)
            for (int i = 1; i < lines.Length; i++)
            {
                try
                {
                    var airport = ParseAirportLine(lines[i]);
                    
                    // Only store airports with IATA codes (commercial airports)
                    if (!string.IsNullOrEmpty(airport.IataCode))
                    {
                        _airports[airport.IataCode] = airport;
                    }
                }
                catch (Exception ex)
                {
                    // Log but don't fail - some lines might be malformed
                    _logger.LogWarning(ex, "Failed to parse airport line {LineNumber}", i);
                }
            }

            _logger.LogInformation("Loaded {Count} airports with IATA codes", _airports.Count);
        }

        /// <summary>
        /// Parse a CSV line into an Airport object.
        /// CSV format: id,ident,type,name,latitude_deg,longitude_deg,...,iata_code,...
        /// </summary>
        private Airport ParseAirportLine(string line)
        {
            // This is a simplified CSV parser - production code would use a library like CsvHelper
            // But for learning purposes, this shows you how to handle quoted CSV fields
            
            var fields = ParseCsvLine(line);
            
            // Based on the CSV structure we saw:
            // 0=id, 1=ident, 2=type, 3=name, 4=latitude, 5=longitude, 6=elevation,
            // 7=continent, 8=iso_country, 9=iso_region, 10=municipality, 11=scheduled_service,
            // 12=icao_code, 13=iata_code, ...
            
            return new Airport
            {
                Name = fields[3],
                Latitude = double.Parse(fields[4], CultureInfo.InvariantCulture),
                Longitude = double.Parse(fields[5], CultureInfo.InvariantCulture),
                Municipality = fields[10],
                IataCode = fields[13]  // This might be empty for some airports
            };
        }

        /// <summary>
        /// Simple CSV parser that handles quoted fields.
        /// Why not use String.Split(',')? Because CSV fields can contain commas if quoted.
        /// </summary>
        private List<string> ParseCsvLine(string line)
        {
            var fields = new List<string>();
            var currentField = new System.Text.StringBuilder();
            bool inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    fields.Add(currentField.ToString());
                    currentField.Clear();
                }
                else
                {
                    currentField.Append(c);
                }
            }

            // Add the last field
            fields.Add(currentField.ToString());

            return fields;
        }

        /// <summary>
        /// Get airport information by IATA code.
        /// </summary>
        public Airport? GetAirport(string iataCode)
        {
            if (string.IsNullOrWhiteSpace(iataCode))
                return null;

            return _airports.TryGetValue(iataCode, out var airport) ? airport : null;
        }

        /// <summary>
        /// Calculate the great-circle distance between two airports in miles.
        /// Uses the Haversine formula - the same formula used in aviation.
        /// </summary>
        /// <remarks>
        /// Why Haversine? The Earth is a sphere (roughly), so straight-line distance
        /// doesn't work. Haversine calculates the shortest distance over the Earth's surface.
        /// This is the actual distance a plane would fly (ignoring air traffic routing).
        /// </remarks>
        public double CalculateDistance(string originIata, string destinationIata)
        {
            var origin = GetAirport(originIata);
            var destination = GetAirport(destinationIata);

            if (origin == null || destination == null)
            {
                _logger.LogWarning("Cannot calculate distance: airport not found (origin={Origin}, dest={Dest})", 
                    originIata, destinationIata);
                return 0;
            }

            return CalculateHaversineDistance(
                origin.Latitude, origin.Longitude,
                destination.Latitude, destination.Longitude
            );
        }

        /// <summary>
        /// Haversine formula implementation.
        /// Returns distance in miles.
        /// </summary>
        /// <remarks>
        /// Formula: a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
        ///          c = 2 ⋅ atan2( √a, √(1−a) )
        ///          d = R ⋅ c
        /// Where φ is latitude, λ is longitude, R is earth's radius
        /// </remarks>
        private double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double EarthRadiusMiles = 3958.8; // Earth's radius in miles

            // Convert degrees to radians
            var lat1Rad = DegreesToRadians(lat1);
            var lon1Rad = DegreesToRadians(lon1);
            var lat2Rad = DegreesToRadians(lat2);
            var lon2Rad = DegreesToRadians(lon2);

            // Differences
            var dLat = lat2Rad - lat1Rad;
            var dLon = lon2Rad - lon1Rad;

            // Haversine formula
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return EarthRadiusMiles * c;
        }

        /// <summary>
        /// Convert degrees to radians.
        /// Why? Trigonometric functions in C# expect radians, but coordinates are in degrees.
        /// </summary>
        private double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180.0;
        }

        /// <summary>
        /// Check if an airport exists in our database.
        /// </summary>
        public bool AirportExists(string iataCode)
        {
            return !string.IsNullOrWhiteSpace(iataCode) && _airports.ContainsKey(iataCode);
        }

        /// <summary>
        /// Get count of loaded airports (useful for health checks).
        /// </summary>
        public int GetAirportCount() => _airports.Count;
    }
}