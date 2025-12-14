namespace FlightPredictor.API.Services
{
    /// <summary>
    /// Service for retrieving weather data for flight predictions.
    /// 
    /// CURRENT IMPLEMENTATION: Uses reasonable default weather values.
    /// 
    /// FUTURE ENHANCEMENT: Integrate with NOAA Weather API to get real forecasted weather.
    /// The interface is designed to support this future integration with minimal changes.
    /// 
    /// </summary>
    public class WeatherService
    {
        private readonly AirportService _airportService;
        private readonly ILogger<WeatherService> _logger;

        public WeatherService(AirportService airportService, ILogger<WeatherService> logger)
        {
            _airportService = airportService;
            _logger = logger;
        }

        /// <summary>
        /// Get weather data for a specific airport and time.
        /// Currently returns reasonable default values.
        /// </summary>
        /// <param name="airportCode">IATA airport code (e.g., "ATL")</param>
        /// <param name="dateTime">Date and time of the flight</param>
        /// <returns>Weather data</returns>
        public async Task<WeatherData> GetWeatherAsync(string airportCode, DateTime dateTime)
        {
            _logger.LogDebug("Getting weather for {Airport} at {DateTime}", airportCode, dateTime);

            // Get airport coordinates (we'll need these for NOAA API later)
            var airport = _airportService.GetAirport(airportCode);
            
            if (airport == null)
            {
                _logger.LogWarning("Airport {Code} not found, using default weather", airportCode);
                return GetDefaultWeather();
            }

            // TODO: Replace with actual NOAA API call
            // For now, return seasonally-adjusted defaults based on month and location
            var weather = GetSeasonalDefaults(dateTime.Month, airport.Latitude);

            _logger.LogDebug("Weather for {Airport}: Temp={Temp}°F, Wind={Wind}mph", 
                airportCode, weather.Temperature, weather.WindSpeed);

            // Simulate async API call (remove when implementing real API)
            await Task.Delay(10);

            return weather;
        }

        /// <summary>
        /// Get reasonable default weather values.
        /// Based on US national averages.
        /// </summary>
        private WeatherData GetDefaultWeather()
        {
            return new WeatherData
            {
                Temperature = 65.0,      // Mild temperature
                Dewpoint = 50.0,         // Moderate humidity
                Pressure = 1013.25,      // 1013 millibars
                WindDirection = 180.0,   // South wind (arbitrary but reasonable)
                WindSpeed = 8.0,         // Light breeze
                SkyCoverage = 3.0,       // Partly cloudy (0=clear, 8=overcast)
                Precipitation = 0.0      // No precipitation
            };
        }

        /// <summary>
        /// Get seasonally-adjusted weather defaults based on month and latitude.
        /// This provides more realistic variation than static defaults.
        /// </summary>
        /// <remarks>
        /// Temperature varies by:
        /// - Season (month)
        /// - Latitude (northern airports colder in winter, warmer in summer)
        /// 
        /// This is a simplified model. Real implementation would use NOAA forecasts.
        /// </remarks>
        private WeatherData GetSeasonalDefaults(int month, double latitude)
        {
            // Base temperature varies by season
            // Using typical US continental patterns
            double baseTemp = month switch
            {
                12 or 1 or 2 => 35.0,   // Winter: cold
                3 or 4 or 5 => 55.0,    // Spring: mild
                6 or 7 or 8 => 80.0,    // Summer: hot
                9 or 10 or 11 => 60.0,  // Fall: cool
                _ => 65.0
            };

            // Adjust for latitude (roughly: more northern = colder in winter, similar in summer)
            // Latitude ranges: ~25 (South Florida) to ~48 (Northern border)
            // For simplicity: each degree north = 0.5°F colder in winter
            if (month is 12 or 1 or 2)
            {
                baseTemp -= (latitude - 35.0) * 0.5;
            }

            // Dewpoint is typically 10-20°F below temperature
            double dewpoint = baseTemp - 15.0;

            // Wind speed varies slightly by season (higher in winter/spring)
            double windSpeed = month is 12 or 1 or 2 or 3 or 4 ? 12.0 : 8.0;

            // Sky coverage: more clouds in winter
            double skyCoverage = month is 12 or 1 or 2 ? 4.0 : 3.0;

            // Precipitation: higher chance in spring
            double precipitation = month is 3 or 4 or 5 ? 0.1 : 0.0;

            return new WeatherData
            {
                Temperature = baseTemp,
                Dewpoint = dewpoint,
                Pressure = 1013.25,           // Sea level standard
                WindDirection = 180.0,       // South wind (common in US)
                WindSpeed = windSpeed,
                SkyCoverage = skyCoverage,
                Precipitation = precipitation
            };
        }

        /// <summary>
        /// FUTURE IMPLEMENTATION: Get weather from NOAA API.
        /// 
        /// Steps for real implementation:
        /// 1. Call NOAA points API: https://api.weather.gov/points/{lat},{lon}
        /// 2. Extract forecast grid URL from response
        /// 3. Call forecast grid API for hourly data
        /// 4. Find the forecast period matching the flight time
        /// 5. Parse weather parameters from the forecast
        /// 6. Add caching to respect rate limits (5 requests/second)
        /// 7. Add retry logic for API failures
        /// 8. Handle timezone conversions (NOAA returns UTC)
        /// 
        /// Example NOAA API flow:
        /// GET https://api.weather.gov/points/33.64,-84.43
        /// → Returns: { "properties": { "forecastHourly": "https://..." } }
        /// GET {forecastHourly URL}
        /// → Returns: { "properties": { "periods": [...] } }
        /// → Parse period matching flight time
        /// </summary>
        private async Task<WeatherData> GetWeatherFromNOAA(double latitude, double longitude, DateTime dateTime)
        {
            // TODO: Implement NOAA API integration
            // This is a placeholder showing the intended signature
            throw new NotImplementedException("NOAA API integration pending");
        }

        /// <summary>
        /// Weather data structure matching the 7 weather features per location.
        /// </summary>
        public class WeatherData
        {
            /// <summary>Temperature in Fahrenheit</summary>
            public double Temperature { get; set; }
            
            /// <summary>Dewpoint in Fahrenheit (indicates humidity)</summary>
            public double Dewpoint { get; set; }
            
            /// <summary>Atmospheric pressure in inches of mercury (inHg)</summary>
            public double Pressure { get; set; }
            
            /// <summary>Wind direction in degrees (0-360, where 0=North, 180=South)</summary>
            public double WindDirection { get; set; }
            
            /// <summary>Wind speed in miles per hour</summary>
            public double WindSpeed { get; set; }
            
            /// <summary>Sky coverage (0=clear, 8=overcast)</summary>
            public double SkyCoverage { get; set; }
            
            /// <summary>Precipitation in inches</summary>
            public double Precipitation { get; set; }
        }
    }
}