/**
 * API Service - Centralized service for all API calls to the C# backend
 * Base URL points to your ASP.NET Core API
 */

const API_BASE_URL = 'http://localhost:5058/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

// ============================================================================
// PREDICTION ENDPOINTS
// ============================================================================

export interface FlightPredictionRequest {
  dayOfWeek: number;
  month: number;
  dayOfMonth: number;
  hour: number;
  minute: number;
  originAirport: string;
  destinationAirport: string;
  carrier: string;
  flightDate?: string;
}

export interface FlightPredictionResponse {
  isDelayed: boolean;
  probability: number;
  confidence: number;
  message: string;
  predictedAt: string;
}

export const predictionApi = {
  /**
   * Make a flight delay prediction
   */
  predict: async (request: FlightPredictionRequest): Promise<FlightPredictionResponse> => {
    return fetchApi<FlightPredictionResponse>('/prediction/predict', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Check prediction service health
   */
  health: async () => {
    return fetchApi('/prediction/health');
  },

  /**
   * Get model information
   */
  modelInfo: async () => {
    return fetchApi('/prediction/model-info');
  },
};

// ============================================================================
// METRICS ENDPOINTS
// ============================================================================

export interface TrainingHistory {
  train_loss: number[];
  val_loss: number[];
  train_f1: number[];
  val_f1: number[];
  epochs: number;
  [key: string]: any; // Allow for additional fields
}

export interface ModelMetadata {
  model_version: string;
  trained_date: string;
  input_features: number;
  architecture: {
    input_size: number;
    hidden_layers: number[];
    output_size: number;
  };
  training_samples: number;
  validation_samples: number;
  test_samples: number;
  best_val_loss: number;
  epochs_trained: number;
  [key: string]: any;
}

export interface DatasetStats {
  overall_delay_rate: number;
  total_flights: number;
  origin_stats: Record<string, any>;
  dest_stats: Record<string, any>;
  carrier_stats: Record<string, any>;
  [key: string]: any;
}

export interface FeatureInfo {
  features: string[];
  count: number;
  [key: string]: any;
}

export const metricsApi = {
  /**
   * Get training history (loss curves, metrics over epochs)
   */
  getTrainingHistory: async (): Promise<TrainingHistory> => {
    return fetchApi<TrainingHistory>('/metrics/training-history');
  },

  /**
   * Get model metadata (architecture, version, training info)
   */
  getModelMetadata: async (): Promise<ModelMetadata> => {
    return fetchApi<ModelMetadata>('/metrics/model-metadata');
  },

  /**
   * Get dataset statistics (delay rates, flight counts)
   */
  getDatasetStats: async (): Promise<DatasetStats> => {
    return fetchApi<DatasetStats>('/metrics/dataset-stats');
  },

  /**
   * Get feature information (45 features used by model)
   */
  getFeatureInfo: async (): Promise<FeatureInfo> => {
    return fetchApi<FeatureInfo>('/metrics/feature-info');
  },

  /**
   * Check metrics service health
   */
  health: async () => {
    return fetchApi('/metrics/health');
  },
};

// ============================================================================
// COMBINED API EXPORTS
// ============================================================================

export const api = {
  prediction: predictionApi,
  metrics: metricsApi,
};

export default api;
