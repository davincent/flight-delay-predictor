namespace FlightPredictor.API.DTOs
{
    /// <summary>
    /// Represents the prediction result returned to the client.
    /// </summary>
    public class FlightPredictionResponse
    {
        /// <summary>
        /// Whether the flight is predicted to be delayed (>15 minutes)
        /// </summary>
        public bool IsDelayed { get; set; }
        
        /// <summary>
        /// Probability of delay (0.0 to 1.0)
        /// </summary>
        public float Probability { get; set; }
        
        /// <summary>
        /// Confidence score (0.0 to 1.0)
        /// How confident the model is in this prediction
        /// </summary>
        public float Confidence { get; set; }
        
        /// <summary>
        /// Human-readable prediction message
        /// </summary>
        public string Message { get; set; } = string.Empty;
        
        /// <summary>
        /// Timestamp of when prediction was made
        /// </summary>
        public DateTime PredictedAt { get; set; } = DateTime.UtcNow;
    }
}