using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using FlightPredictor.API.DTOs;

namespace FlightPredictor.API.Services
{
    /// <summary>
    /// Main service that orchestrates all other services to make flight delay predictions.
    /// This is the "conductor" - it doesn't do the work itself, but coordinates everything.
    /// </summary>
    public class ModelService : IDisposable
    {
        private readonly InferenceSession _session;
        private readonly AirportService _airportService;
        private readonly HistoricalStatsService _historicalStatsService;
        private readonly WeatherService _weatherService;
        private readonly FeatureEngineeringService _featureEngineeringService;
        private readonly ILogger<ModelService> _logger;

        public ModelService(
            AirportService airportService,
            HistoricalStatsService historicalStatsService,
            WeatherService weatherService,
            FeatureEngineeringService featureEngineeringService,
            ILogger<ModelService> logger)
        {
            _airportService = airportService;
            _historicalStatsService = historicalStatsService;
            _weatherService = weatherService;
            _featureEngineeringService = featureEngineeringService;
            _logger = logger;

            // Load ONNX model
            var modelPath = Path.Combine(AppContext.BaseDirectory, "Models", "flight_delay_model.onnx");
            
            if (!File.Exists(modelPath))
            {
                throw new FileNotFoundException($"ONNX model not found at: {modelPath}");
            }

            var sessionOptions = new Microsoft.ML.OnnxRuntime.SessionOptions();
            _session = new InferenceSession(modelPath, sessionOptions);
            
            _logger.LogInformation("ModelService initialized with ONNX model from {ModelPath}", modelPath);
        }

        /// <summary>
        /// Make a flight delay prediction.
        /// This is the main orchestration method that coordinates all services.
        /// </summary>
        public async Task<FlightPredictionResponse> PredictAsync(FlightPredictionRequest request)
        {
            try
            {
                _logger.LogInformation(
                    "Processing prediction for {Carrier} flight from {Origin} to {Dest} on {Month}/{Day} at {Hour}:{Minute:D2}",
                    request.Carrier, request.OriginAirport, request.DestinationAirport,
                    request.Month, request.DayOfMonth, request.Hour, request.Minute
                );

                // Step 1: Get airport information
                var originAirport = _airportService.GetAirport(request.OriginAirport);
                var destAirport = _airportService.GetAirport(request.DestinationAirport);

                if (originAirport == null)
                {
                    return new FlightPredictionResponse
                    {
                        IsDelayed = false,
                        Probability = 0,
                        Confidence = 0,
                        Message = $"Unknown origin airport: {request.OriginAirport}",
                        PredictedAt = DateTime.UtcNow
                    };
                }

                if (destAirport == null)
                {
                    return new FlightPredictionResponse
                    {
                        IsDelayed = false,
                        Probability = 0,
                        Confidence = 0,
                        Message = $"Unknown destination airport: {request.DestinationAirport}",
                        PredictedAt = DateTime.UtcNow
                    };
                }

                // Step 2: Calculate geographic features
                var distance = _airportService.CalculateDistance(
                    request.OriginAirport, 
                    request.DestinationAirport
                );

                // Step 3: Estimate flight duration and arrival hour
                // Average commercial jet speed: ~500 mph cruising + 30 min for taxi/climb/descent
                var estimatedFlightHours = (distance / 500.0) + 0.5; // hours
                var scheduledElapsedMinutes = (int)(estimatedFlightHours * 60);
                
                // Calculate arrival hour
                var departureMinutes = request.Hour * 60 + request.Minute;
                var arrivalMinutes = departureMinutes + scheduledElapsedMinutes;
                var arrivalHour = (arrivalMinutes / 60) % 24; // Wrap around 24 hours

                _logger.LogDebug(
                    "Flight details: Distance={Distance:F1}mi, EstDuration={Duration:F1}hrs, ArrHour={ArrHour}",
                    distance, estimatedFlightHours, arrivalHour
                );

                // Step 4: Get historical statistics
                var originDelayRate = _historicalStatsService.GetOriginDelayRate(request.OriginAirport);
                var destDelayRate = _historicalStatsService.GetDestDelayRate(request.DestinationAirport);
                var carrierDelayRate = _historicalStatsService.GetCarrierDelayRate(request.Carrier);
                var routeDelayRate = _historicalStatsService.GetRouteDelayRate(
                    request.OriginAirport, 
                    request.DestinationAirport
                );
                var originDailyFlights = _historicalStatsService.GetOriginDailyFlights(request.OriginAirport);
                var destDailyFlights = _historicalStatsService.GetDestDailyFlights(request.DestinationAirport);

                // Step 5: Get weather data for both airports
                // Use the provided flight date, or default to today
                var flightDateTime = request.FlightDate ?? DateTime.Now;
                var departureDateTime = new DateTime(
                    flightDateTime.Year, 
                    flightDateTime.Month, 
                    flightDateTime.Day,
                    request.Hour, 
                    request.Minute, 
                    0
                );

                var originWeather = await _weatherService.GetWeatherAsync(
                    request.OriginAirport, 
                    departureDateTime
                );

                // For arrival weather, use estimated arrival time
                var arrivalDateTime = departureDateTime.AddMinutes(scheduledElapsedMinutes);
                var destWeather = await _weatherService.GetWeatherAsync(
                    request.DestinationAirport, 
                    arrivalDateTime
                );

                // Step 6: Build RawFlightData object with all gathered information
                var rawData = new FeatureEngineeringService.RawFlightData
                {
                    // Temporal
                    Month = request.Month,
                    DayOfMonth = request.DayOfMonth,
                    DayOfWeek = request.DayOfWeek,
                    DepHour = request.Hour,
                    DepMinute = request.Minute,
                    ArrHour = arrivalHour,

                    // Geographic
                    OriginAirport = request.OriginAirport,
                    DestinationAirport = request.DestinationAirport,
                    Distance = distance,

                    // Airline
                    Carrier = request.Carrier,

                    // Historical
                    OriginDelayRate = originDelayRate,
                    DestDelayRate = destDelayRate,
                    CarrierDelayRate = carrierDelayRate,
                    RouteDelayRate = routeDelayRate,
                    OriginDailyFlights = originDailyFlights,
                    DestDailyFlights = destDailyFlights,

                    // Flight characteristics
                    ScheduledElapsedTime = scheduledElapsedMinutes,

                    // Departure weather
                    DepTemp = originWeather.Temperature,
                    DepDewpoint = originWeather.Dewpoint,
                    DepPressure = originWeather.Pressure,
                    DepWindDir = originWeather.WindDirection,
                    DepWindSpeed = originWeather.WindSpeed,
                    DepSkyCoverage = originWeather.SkyCoverage,
                    DepPrecip = originWeather.Precipitation,

                    // Arrival weather
                    ArrTemp = destWeather.Temperature,
                    ArrDewpoint = destWeather.Dewpoint,
                    ArrPressure = destWeather.Pressure,
                    ArrWindDir = destWeather.WindDirection,
                    ArrWindSpeed = destWeather.WindSpeed,
                    ArrSkyCoverage = destWeather.SkyCoverage,
                    ArrPrecip = destWeather.Precipitation
                };

                // Step 7: Transform into 45 engineered and scaled features
                var features = _featureEngineeringService.TransformFeatures(rawData);

                _logger.LogInformation("First 10 features: [{Features}]", string.Join(", ", features.Take(10).Select(f => f.ToString("F4"))));
                _logger.LogInformation("Last 10 features: [{Features}]", string.Join(", ", features.Skip(35).Select(f => f.ToString("F4"))));


                _logger.LogDebug("Features transformed: {Count} features ready for model", features.Length);

                // Step 8: Create input tensor for ONNX
                // Shape is [1, 45] - batch size of 1, 45 features
                var inputTensor = new DenseTensor<float>(features, new[] { 1, 45 });

                // Step 9: Run inference
                var inputs = new List<NamedOnnxValue>
                {
                    NamedOnnxValue.CreateFromTensor("input", inputTensor)
                };

                using var results = _session.Run(inputs);
                
                // Step 10: Extract output
                // Model outputs a logit (raw score), need to apply sigmoid
                var output = results.First().AsEnumerable<float>().First();

                _logger.LogInformation("Raw model output (logit): {Output}", output);
                
                // Apply sigmoid: probability = 1 / (1 + e^(-logit))
                var probability = 1.0f / (1.0f + MathF.Exp(-output));

                // Step 11: Determine prediction and confidence
                var isDelayed = probability > 0.5f;
                var confidence = MathF.Abs(probability - 0.5f) * 2.0f;

                _logger.LogInformation(
                    "Prediction complete: IsDelayed={IsDelayed}, Probability={Probability:P1}, Confidence={Confidence:P1}",
                    isDelayed, probability, confidence
                );

                // Step 12: Build and return response
                return new FlightPredictionResponse
                {
                    IsDelayed = isDelayed,
                    Probability = probability,
                    Confidence = confidence,
                    Message = BuildPredictionMessage(isDelayed, probability, confidence),
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
        /// Build a human-readable message based on the prediction.
        /// </summary>
        private string BuildPredictionMessage(bool isDelayed, float probability, float confidence)
        {
            if (confidence < 0.3f)
            {
                // Low confidence - be honest about uncertainty
                return $"Uncertain prediction (low confidence). Delay probability: {probability:P1}";
            }

            if (isDelayed)
            {
                return confidence switch
                {
                    >= 0.7f => $"Flight is highly likely to be delayed ({probability:P0} probability)",
                    >= 0.5f => $"Flight is likely to be delayed ({probability:P0} probability)",
                    _ => $"Flight may be delayed ({probability:P0} probability)"
                };
            }
            else
            {
                return confidence switch
                {
                    >= 0.7f => $"Flight is highly likely to be on-time ({(1 - probability):P0} probability)",
                    >= 0.5f => $"Flight is likely to be on-time ({(1 - probability):P0} probability)",
                    _ => $"Flight may be on-time ({(1 - probability):P0} probability)"
                };
            }
        }

        public void Dispose()
        {
            _session?.Dispose();
        }
    }
}