namespace FlightPredictor.API.DTOs
{
    /// <summary>
    /// Represents the input data for flight delay prediction.
    /// This matches the features we need to send to the model.
    /// </summary>
    public class FlightPredictionRequest
    {
        // Basic flight info
        public int DayOfWeek { get; set; }  // 0-6 (Monday=0) or 1-7 (Monday=1)
        public int Month { get; set; }      // 1-12
        public int DayOfMonth { get; set; } // 1-31
        public int Hour { get; set; }       // 0-23 (departure hour)
        public int Minute { get; set; }     // 0-59 (departure minute)
        
        // Airport and carrier codes
        public string OriginAirport { get; set; } = string.Empty;
        public string DestinationAirport { get; set; } = string.Empty;
        public string Carrier { get; set; } = string.Empty;
        
        // Optional: Flight date (for weather forecasting)
        // If not provided, defaults to today
        public DateTime? FlightDate { get; set; }
    }
}
