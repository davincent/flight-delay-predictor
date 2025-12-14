/**
 * Custom React hooks for API calls
 * These hooks manage loading, error, and data states for API interactions
 */

import { useState, useEffect } from 'react';
import { 
  api,
  FlightPredictionRequest, 
  FlightPredictionResponse,
  TrainingHistory,
  ModelMetadata,
  DatasetStats,
  FeatureInfo
} from '../services/apiService';

/**
 * Generic hook state interface
 */
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// PREDICTION HOOKS
// ============================================================================

/**
 * Hook for making flight delay predictions
 * Returns a function to make predictions on demand
 */
export function usePrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<FlightPredictionResponse | null>(null);

  const predict = async (request: FlightPredictionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.prediction.predict(request);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Prediction failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const reset = () => {
    setData(null);
    setError(null);
  };

  return { predict, result: data, loading, error, reset };
}

// ============================================================================
// METRICS HOOKS
// ============================================================================

/**
 * Hook for fetching training history
 * Automatically fetches on mount
 */
export function useTrainingHistory(): UseApiState<TrainingHistory> {
  const [data, setData] = useState<TrainingHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.metrics.getTrainingHistory();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch training history'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching model metadata
 * Automatically fetches on mount
 */
export function useModelMetadata(): UseApiState<ModelMetadata> {
  const [data, setData] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.metrics.getModelMetadata();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch model metadata'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching dataset statistics
 * Automatically fetches on mount
 */
export function useDatasetStats(): UseApiState<DatasetStats> {
  const [data, setData] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.metrics.getDatasetStats();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dataset stats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching feature information
 * Automatically fetches on mount
 */
export function useFeatureInfo(): UseApiState<FeatureInfo> {
  const [data, setData] = useState<FeatureInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.metrics.getFeatureInfo();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch feature info'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// ============================================================================
// COMBINED HOOKS FOR PAGES THAT NEED MULTIPLE DATA SOURCES
// ============================================================================

/**
 * Hook that combines training history and model metadata
 * Useful for the Training Metrics page
 */
export function useTrainingData() {
  const history = useTrainingHistory();
  const metadata = useModelMetadata();

  return {
    history: history.data,
    metadata: metadata.data,
    loading: history.loading || metadata.loading,
    error: history.error || metadata.error,
    refetch: async () => {
      await Promise.all([history.refetch(), metadata.refetch()]);
    },
  };
}

// ============================================================================
// REFERENCE DATA HOOK (Hardcoded for now)
// ============================================================================

/**
 * Hook for reference data (airports, carriers)
 * Currently returns hardcoded data - can be replaced with API calls later
 */
export function useReferenceData() {
  // Major US airports
  const airports = [
    { code: 'ATL', name: 'Hartsfield-Jackson Atlanta' },
    { code: 'LAX', name: 'Los Angeles International' },
    { code: 'ORD', name: "Chicago O'Hare" },
    { code: 'DFW', name: 'Dallas/Fort Worth' },
    { code: 'DEN', name: 'Denver International' },
    { code: 'JFK', name: 'John F. Kennedy' },
    { code: 'SFO', name: 'San Francisco' },
    { code: 'SEA', name: 'Seattle-Tacoma' },
    { code: 'LAS', name: 'Las Vegas' },
    { code: 'MCO', name: 'Orlando' },
    { code: 'EWR', name: 'Newark Liberty' },
    { code: 'CLT', name: 'Charlotte Douglas' },
    { code: 'PHX', name: 'Phoenix Sky Harbor' },
    { code: 'IAH', name: 'Houston George Bush' },
    { code: 'MIA', name: 'Miami International' },
    { code: 'BOS', name: 'Boston Logan' },
    { code: 'MSP', name: 'Minneapolis-St. Paul' },
    { code: 'DTW', name: 'Detroit Metro' },
    { code: 'PHL', name: 'Philadelphia' },
    { code: 'LGA', name: 'LaGuardia' },
  ];

  // Major US carriers
  const carriers = [
    { code: 'AA', name: 'American Airlines' },
    { code: 'DL', name: 'Delta Air Lines' },
    { code: 'UA', name: 'United Airlines' },
    { code: 'WN', name: 'Southwest Airlines' },
    { code: 'B6', name: 'JetBlue Airways' },
    { code: 'AS', name: 'Alaska Airlines' },
    { code: 'NK', name: 'Spirit Airlines' },
    { code: 'F9', name: 'Frontier Airlines' },
    { code: 'G4', name: 'Allegiant Air' },
  ];

  return {
    airports,
    carriers,
    loading: false,
  };
}