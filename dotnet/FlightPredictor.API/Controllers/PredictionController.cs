using Microsoft.AspNetCore.Mvc;
using FlightPredictor.API.DTOs;
using FlightPredictor.API.Services;

namespace FlightPredictor.API.Controllers
{
    /// <summary>
    /// API endpoints for flight delay predictions.
    /// [ApiController] adds automatic model validation and better error responses.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PredictionController : ControllerBase
    {
        private readonly ModelService _modelService;
        private readonly ILogger<PredictionController> _logger;

        // Constructor - ASP.NET automatically injects dependencies
        public PredictionController(ModelService modelService, ILogger<PredictionController> logger)
        {
            _modelService = modelService;
            _logger = logger;
        }

        /// <summary>
        /// Predict if a flight will be delayed.
        /// </summary>
        /// <param name="request">Flight information</param>
        /// <returns>Prediction result with probability and confidence</returns>
        /// <response code="200">Prediction successful</response>
        /// <response code="400">Invalid input data</response>
        /// <response code="500">Internal server error</response>
        [HttpPost("predict")]
        [ProducesResponseType(typeof(FlightPredictionResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public ActionResult<FlightPredictionResponse> Predict([FromBody] FlightPredictionRequest request)
        {
            try
            {
                _logger.LogInformation(
                    "Prediction requested for {Carrier} flight from {Origin} to {Destination}",
                    request.Carrier,
                    request.OriginAirport,
                    request.DestinationAirport
                );

                // Validate input (basic checks)
                if (request.Month < 1 || request.Month > 12)
                {
                    return BadRequest("Month must be between 1 and 12");
                }

                if (request.Hour < 0 || request.Hour > 23)
                {
                    return BadRequest("Hour must be between 0 and 23");
                }

                // Make prediction
                var result = _modelService.Predict(request);

                _logger.LogInformation(
                    "Prediction complete: {IsDelayed} (probability: {Probability:F2})",
                    result.IsDelayed,
                    result.Probability
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing prediction request");
                return StatusCode(500, "An error occurred while processing your request");
            }
        }

        /// <summary>
        /// Health check endpoint to verify API is running.
        /// </summary>
        [HttpGet("health")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult Health()
        {
            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                service = "FlightPredictor.API"
            });
        }

        /// <summary>
        /// Get model information.
        /// </summary>
        [HttpGet("model-info")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult ModelInfo()
        {
            return Ok(new
            {
                modelVersion = "1.0",
                features = 31,
                architecture = "3-layer neural network",
                framework = "PyTorch → ONNX"
            });
        }
    }
}