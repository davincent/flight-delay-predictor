using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using FlightPredictor.API.DTOs;

namespace FlightPredictor.API.Services
{
    /// <summary>
    /// Service responsible for loading the ONNX model and making predictions.
    /// This is registered as a Singleton, meaning one instance serves all requests.
    /// </summary>
    public class ModelService
    {
        private readonly InferenceSession _session;
        private readonly ILogger<ModelService> _logger;

        // Constructor - runs once when the service is created
        public ModelService(ILogger<ModelService> logger)
        {
            _logger = logger;
            
            // Load the ONNX model from disk
            var modelPath = Path.Combine(AppContext.BaseDirectory, "Models", "flight_delay_model.onnx");
            
            if (!File.Exists(modelPath))
            {
                throw new FileNotFoundException($"ONNX model not found at: {modelPath}");
            }
            
            // Create inference session
            // SessionOptions allows GPU configuration (we'll use CPU for now)
            var sessionOptions = new Microsoft.ML.OnnxRuntime.SessionOptions();
            _session = new InferenceSession(modelPath, sessionOptions);
            
            _logger.LogInformation("ONNX model loaded successfully from {ModelPath}", modelPath);
        }

        /// <summary>
        /// Make a prediction for a single flight.
        /// </summary>
        public FlightPredictionResponse Predict(FlightPredictionRequest request)
        {
            try
            {
                // Step 1: Preprocess the input into the 31 features
                var features = PreprocessInput(request);
                
                // Step 2: Create input tensor
                // Tensor is a multi-dimensional array - shape is [1, 31]
                // 1 = batch size (single prediction), 31 = number of features
                var inputTensor = new DenseTensor<float>(features, new[] { 1, 31 });
                
                // Step 3: Create named inputs (must match ONNX export names)
                var inputs = new List<NamedOnnxValue>
                {
                    NamedOnnxValue.CreateFromTensor("input", inputTensor)
                };
                
                // Step 4: Run inference
                using var results = _session.Run(inputs);
                
                // Step 5: Extract output (it's a logit, needs sigmoid)
                var output = results.First().AsEnumerable<float>().First();
                
                // Apply sigmoid: probability = 1 / (1 + e^(-logit))
                var probability = 1.0f / (1.0f + MathF.Exp(-output));
                
                // Step 6: Determine if delayed (threshold = 0.5)
                var isDelayed = probability > 0.5f;
                
                // Step 7: Calculate confidence
                // Confidence is how far from 0.5 the probability is
                // If prob = 0.9, confidence = |0.9 - 0.5| * 2 = 0.8
                // If prob = 0.5, confidence = 0 (totally uncertain)
                var confidence = MathF.Abs(probability - 0.5f) * 2.0f;
                
                // Step 8: Build response
                return new FlightPredictionResponse
                {
                    IsDelayed = isDelayed,
                    Probability = probability,
                    Confidence = confidence,
                    Message = isDelayed 
                        ? $"Flight is likely to be delayed ({probability:P1} probability)"
                        : $"Flight is likely on-time ({(1-probability):P1} probability)",
                    PredictedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error making prediction");
                throw;
            }
        }

        /// <summary>
        /// Convert the request into the 31 features the model expects.
        /// THIS MUST MATCH YOUR PYTHON PREPROCESSING EXACTLY.
        /// </summary>
        private float[] PreprocessInput(FlightPredictionRequest request)
        {
            // For now, we'll create a dummy array of 31 features
            // You'll need to replace this with actual feature engineering
            // that matches your Python code EXACTLY
            
            var features = new float[31];
            
            // Example mapping (you'll need to adjust based on your actual features):
            // Feature 0: Day of week
            features[0] = request.DayOfWeek;
            
            // Feature 1: Month
            features[1] = request.Month;
            
            // Feature 2: Day of month
            features[2] = request.DayOfMonth;
            
            // Feature 3: Hour
            features[3] = request.Hour;
            
            // Feature 4: Minute
            features[4] = request.Minute;
            
            // Feature 5-6: Hour cyclical encoding (sin and cos)
            // Why? Hours are cyclical: 23 and 0 are close, but numerically far apart
            // sin/cos encoding captures this circular relationship
            var hourRadians = (request.Hour / 24.0f) * 2.0f * MathF.PI;
            features[5] = MathF.Sin(hourRadians);
            features[6] = MathF.Cos(hourRadians);
            
            // Feature 7-8: Day of week cyclical encoding
            var dowRadians = (request.DayOfWeek / 7.0f) * 2.0f * MathF.PI;
            features[7] = MathF.Sin(dowRadians);
            features[8] = MathF.Cos(dowRadians);
            
            // Feature 9-10: Month cyclical encoding
            var monthRadians = ((request.Month - 1) / 12.0f) * 2.0f * MathF.PI;
            features[9] = MathF.Sin(monthRadians);
            features[10] = MathF.Cos(monthRadians);
            
            // Features 11-30: Placeholder for airport/carrier encodings and other features
            // TODO: Load label encoders and apply transformations
            // For now, fill with zeros (this won't give accurate predictions)
            for (int i = 11; i < 31; i++)
            {
                features[i] = 0.0f;
            }
            
            _logger.LogDebug("Preprocessed features: [{Features}]", string.Join(", ", features.Take(10)));
            
            return features;
        }

        // Cleanup when service is disposed
        public void Dispose()
        {
            _session?.Dispose();
        }
    }
}