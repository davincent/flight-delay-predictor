// API Client Service - Centralized HTTP communication with your ASP.NET Core backend

import {
  PredictionRequest,
  PredictionResponse,
  TrainingMetrics,
  ModelArchitecture,
  HistoricalData,
  ApiError,
} from '../types/api';

/**
 * Base configuration for API requests
 * In production, use environment variables: import.meta.env.VITE_API_BASE_URL
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Custom error class for API-related errors
 * This extends the built-in Error class to add statusCode property
 */
class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Generic fetch wrapper that handles common HTTP concerns:
 * - JSON serialization/deserialization
 * - Error handling
 * - Headers configuration
 * - TypeScript generics for type safety
 */
async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Default headers for JSON communication
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Make the HTTP request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if the response is OK (status 200-299)
    if (!response.ok) {
      // Try to parse error details from the response body
      let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
      let errorDetails: string | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData.details;
      } catch {
        // If response body isn't JSON, use status text
      }

      throw new ApiClientError(errorMessage, response.status, errorDetails);
    }

    // Parse and return JSON response
    // The generic type T ensures the return type matches what the caller expects
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Re-throw ApiClientError as-is
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors (no internet, server unreachable, etc.)
    if (error instanceof TypeError) {
      throw new ApiClientError(
        'Network error: Unable to connect to the server. Please check your connection.',
        0,
        error.message
      );
    }

    // Handle unexpected errors
    throw new ApiClientError(
      'An unexpected error occurred',
      0,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * API Service Object
 * This object groups all API endpoints into logical categories
 * Each method returns a Promise with properly typed data
 */
export const apiService = {
  /**
   * Prediction Endpoints
   */
  prediction: {
    /**
     * Make a flight delay prediction
     * POST /api/prediction/predict
     * 
     * @param request - Flight details for prediction
     * @returns Prediction result with confidence scores
     * 
     * Example usage:
     * const result = await apiService.prediction.predict({
     *   dayOfWeek: 2,
     *   month: 6,
     *   dayOfMonth: 15,
     *   hour: 14,
     *   minute: 30,
     *   originAirport: 'LAX',
     *   destinationAirport: 'JFK',
     *   carrier: 'AA'
     * });
     */
    predict: async (request: PredictionRequest): Promise<PredictionResponse> => {
      return fetchWithErrorHandling<PredictionResponse>(
        `${API_BASE_URL}/prediction/predict`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
    },

    /**
     * Get available airports
     * GET /api/prediction/airports
     */
    getAirports: async (): Promise<string[]> => {
      return fetchWithErrorHandling<string[]>(
        `${API_BASE_URL}/prediction/airports`
      );
    },

    /**
     * Get available carriers
     * GET /api/prediction/carriers
     */
    getCarriers: async (): Promise<string[]> => {
      return fetchWithErrorHandling<string[]>(
        `${API_BASE_URL}/prediction/carriers`
      );
    },
  },

  /**
   * Training Metrics Endpoints
   */
  metrics: {
    /**
     * Get current model training metrics
     * GET /api/metrics
     */
    getMetrics: async (): Promise<TrainingMetrics> => {
      return fetchWithErrorHandling<TrainingMetrics>(
        `${API_BASE_URL}/metrics`
      );
    },

    /**
     * Get training history (if your API supports it)
     * GET /api/metrics/history
     */
    getHistory: async (): Promise<TrainingMetrics[]> => {
      return fetchWithErrorHandling<TrainingMetrics[]>(
        `${API_BASE_URL}/metrics/history`
      );
    },
  },

  /**
   * Model Architecture Endpoints
   */
  model: {
    /**
     * Get model architecture details
     * GET /api/model/architecture
     */
    getArchitecture: async (): Promise<ModelArchitecture> => {
      return fetchWithErrorHandling<ModelArchitecture>(
        `${API_BASE_URL}/model/architecture`
      );
    },
  },

  /**
   * Training Data Endpoints
   */
  data: {
    /**
     * Get paginated training data
     * GET /api/data?page=1&pageSize=15&search=LAX
     * 
     * @param page - Page number (1-indexed)
     * @param pageSize - Number of records per page
     * @param search - Optional search term
     */
    getTrainingData: async (
      page: number = 1,
      pageSize: number = 15,
      search?: string
    ): Promise<{ data: HistoricalData[]; total: number }> => {
      // Build query string with URLSearchParams
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      return fetchWithErrorHandling<{ data: HistoricalData[]; total: number }>(
        `${API_BASE_URL}/data?${params.toString()}`
      );
    },

    /**
     * Get dataset statistics
     * GET /api/data/stats
     */
    getStats: async (): Promise<{
      totalRecords: number;
      delayedCount: number;
      onTimeCount: number;
    }> => {
      return fetchWithErrorHandling(
        `${API_BASE_URL}/data/stats`
      );
    },
  },

  /**
   * Health Check Endpoint
   */
  health: {
    /**
     * Check if the API is reachable
     * GET /api/health
     */
    check: async (): Promise<{ status: string; timestamp: string }> => {
      return fetchWithErrorHandling(
        `${API_BASE_URL}/health`
      );
    },
  },
};

// Export the error class for use in components
export { ApiClientError };
