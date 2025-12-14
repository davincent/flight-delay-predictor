// API Response Types - These should match your ASP.NET Core backend models

export interface PredictionRequest {
  dayOfWeek: number;
  month: number;
  dayOfMonth: number;
  hour: number;
  minute: number;
  originAirport: string;
  destinationAirport: string;
  carrier: string;
}

export interface PredictionResponse {
  isDelayed: boolean;
  confidence: number;
  delayProbability: number;
  onTimeProbability: number;
  processingTimeMs: number;
  modelVersion?: string;
}

export interface TrainingMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  confusionMatrix: {
    truePositives: number;
    trueNegatives: number;
    falsePositives: number;
    falseNegatives: number;
  };
  trainingDate?: string;
  epoch?: number;
}

export interface ModelArchitecture {
  layers: LayerInfo[];
  totalParameters: number;
  trainableParameters: number;
  nonTrainableParameters: number;
  optimizer: string;
  lossFunction: string;
  learningRate: number;
  batchSize: number;
}

export interface LayerInfo {
  name: string;
  type: string;
  neurons: number;
  activation?: string;
  dropout?: number;
}

export interface HistoricalData {
  id: number;
  dayOfWeek: number;
  month: number;
  dayOfMonth: number;
  hour: number;
  minute: number;
  originAirport: string;
  destinationAirport: string;
  carrier: string;
  delayed: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: string;
}
