using System.Text;
using System.Text.Json;

namespace FlightPredictor.Web.Services
{
    /// <summary>
    /// Client for calling the Flight Predictor API
    /// </summary>
    public class FlightApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<FlightApiClient> _logger;

        public FlightApiClient(HttpClient httpClient, ILogger<FlightApiClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        /// <summary>
        /// Get API health status
        /// </summary>
        public async Task<ApiHealthResponse?> GetHealthAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("api/Prediction/health");
                response.EnsureSuccessStatusCode();
                
                return await response.Content.ReadFromJsonAsync<ApiHealthResponse>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check API health");
                return null;
            }
        }

        /// <summary>
        /// Predict flight delay
        /// </summary>
        public async Task<PredictionResponse?> PredictAsync(PredictionRequest request)
        {
            try
            {
                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync("api/Prediction/predict", content);
                response.EnsureSuccessStatusCode();
                
                return await response.Content.ReadFromJsonAsync<PredictionResponse>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get prediction");
                throw;
            }
        }
    }

    // DTOs matching your API
    public class PredictionRequest
    {
        public int DayOfWeek { get; set; }
        public int Month { get; set; }
        public int DayOfMonth { get; set; }
        public int Hour { get; set; }
        public int Minute { get; set; }
        public string OriginAirport { get; set; } = string.Empty;
        public string DestinationAirport { get; set; } = string.Empty;
        public string Carrier { get; set; } = string.Empty;
        public float? Distance { get; set; }
    }

    public class PredictionResponse
    {
        public bool IsDelayed { get; set; }
        public float Probability { get; set; }
        public float Confidence { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime PredictedAt { get; set; }
    }

    public class ApiHealthResponse
    {
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Service { get; set; } = string.Empty;
    }
}