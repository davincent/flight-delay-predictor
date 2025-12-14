using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace FlightPredictor.API.Controllers
{
    /// <summary>
    /// API endpoints for model training metrics, architecture info, and dataset statistics.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class MetricsController : ControllerBase
    {
        private readonly ILogger<MetricsController> _logger;
        private readonly string _dataPath;

        public MetricsController(ILogger<MetricsController> logger, IWebHostEnvironment env)
        {
            _logger = logger;
            // Path to Data folder in the application directory
            _dataPath = Path.Combine(env.ContentRootPath, "Data");
        }

        /// <summary>
        /// Get training history including loss curves and accuracy metrics over epochs.
        /// </summary>
        /// <response code="200">Training history retrieved successfully</response>
        /// <response code="404">Training history file not found</response>
        /// <response code="500">Error reading training history</response>
        [HttpGet("training-history")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> GetTrainingHistory()
        {
            try
            {
                var filePath = Path.Combine(_dataPath, "training_history.json");
                
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Training history file not found at {FilePath}", filePath);
                    return NotFound(new { error = "Training history not found" });
                }

                var jsonContent = await System.IO.File.ReadAllTextAsync(filePath);
                var data = JsonSerializer.Deserialize<JsonElement>(jsonContent);

                _logger.LogInformation("Training history retrieved successfully");
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading training history");
                return StatusCode(500, new { error = "Failed to retrieve training history" });
            }
        }

        /// <summary>
        /// Get model metadata including architecture, version, and training configuration.
        /// </summary>
        /// <response code="200">Model metadata retrieved successfully</response>
        /// <response code="404">Model metadata file not found</response>
        /// <response code="500">Error reading model metadata</response>
        [HttpGet("model-metadata")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> GetModelMetadata()
        {
            try
            {
                var filePath = Path.Combine(_dataPath, "model_metadata.json");
                
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Model metadata file not found at {FilePath}", filePath);
                    return NotFound(new { error = "Model metadata not found" });
                }

                var jsonContent = await System.IO.File.ReadAllTextAsync(filePath);
                var data = JsonSerializer.Deserialize<JsonElement>(jsonContent);

                _logger.LogInformation("Model metadata retrieved successfully");
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading model metadata");
                return StatusCode(500, new { error = "Failed to retrieve model metadata" });
            }
        }

        /// <summary>
        /// Get dataset statistics including total records, delay rates, and feature information.
        /// </summary>
        /// <response code="200">Dataset statistics retrieved successfully</response>
        /// <response code="404">Historical stats file not found</response>
        /// <response code="500">Error reading dataset statistics</response>
        [HttpGet("dataset-stats")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> GetDatasetStats()
        {
            try
            {
                var filePath = Path.Combine(_dataPath, "historical_stats.json");
                
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Historical stats file not found at {FilePath}", filePath);
                    return NotFound(new { error = "Dataset statistics not found" });
                }

                var jsonContent = await System.IO.File.ReadAllTextAsync(filePath);
                var data = JsonSerializer.Deserialize<JsonElement>(jsonContent);

                _logger.LogInformation("Dataset statistics retrieved successfully");
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading dataset statistics");
                return StatusCode(500, new { error = "Failed to retrieve dataset statistics" });
            }
        }

        /// <summary>
        /// Get feature information including names, types, and descriptions of all 45 model features.
        /// </summary>
        /// <response code="200">Feature info retrieved successfully</response>
        /// <response code="404">Feature info file not found</response>
        /// <response code="500">Error reading feature information</response>
        [HttpGet("feature-info")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> GetFeatureInfo()
        {
            try
            {
                var filePath = Path.Combine(_dataPath, "feature_info.json");
                
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Feature info file not found at {FilePath}", filePath);
                    return NotFound(new { error = "Feature information not found" });
                }

                var jsonContent = await System.IO.File.ReadAllTextAsync(filePath);
                var data = JsonSerializer.Deserialize<JsonElement>(jsonContent);

                _logger.LogInformation("Feature information retrieved successfully");
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading feature information");
                return StatusCode(500, new { error = "Failed to retrieve feature information" });
            }
        }

        /// <summary>
        /// Health check for metrics endpoints.
        /// </summary>
        [HttpGet("health")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult Health()
        {
            var dataDirectory = Path.Combine(_dataPath);
            var filesExist = new
            {
                trainingHistory = System.IO.File.Exists(Path.Combine(_dataPath, "training_history.json")),
                modelMetadata = System.IO.File.Exists(Path.Combine(_dataPath, "model_metadata.json")),
                historicalStats = System.IO.File.Exists(Path.Combine(_dataPath, "historical_stats.json")),
                featureInfo = System.IO.File.Exists(Path.Combine(_dataPath, "feature_info.json"))
            };

            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                service = "MetricsController",
                dataPath = _dataPath,
                files = filesExist
            });
        }
    }
}