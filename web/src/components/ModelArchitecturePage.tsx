import { useModelMetadata, useFeatureInfo } from '../hooks/useApi';
import { Layers, ArrowDown, Cpu, Zap, Settings, Loader2, AlertCircle } from 'lucide-react';

interface LayerSpec {
  name: string;
  type: string;
  neurons: number;
  activation?: string;
  dropout?: number;
  description: string;
}

export function ModelArchitecturePage() {
  const { data: metadata, loading: metadataLoading, error: metadataError } = useModelMetadata();
  const { data: featureInfo, loading: featureLoading, error: featureError } = useFeatureInfo();

  const loading = metadataLoading || featureLoading;
  const error = metadataError || featureError;

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading model architecture...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl text-slate-900 mb-2">Failed to load model architecture</h2>
          <p className="text-slate-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!metadata || !featureInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">No model data available</p>
      </div>
    );
  }

  // Build layer specifications from metadata
  // Note: Your actual model is [448, 512, 512] from the .pth file inspection
  // The metadata.json shows [128, 64, 32] which is outdated - we'll use actual architecture
  const actualArchitecture = [448, 512, 512]; // From your .pth file analysis
  
  const modelLayers = [
    {
      name: 'Input Layer',
      type: 'Dense',
      neurons: metadata.input_features || 45,
      description: `Receives ${metadata.input_features || 45} engineered features from flight, airport, temporal, historical, and weather data`,
    },
    ...actualArchitecture.map((neurons, index) => [
      {
        name: `Hidden Layer ${index + 1}`,
        type: 'Dense',
        neurons: neurons,
        activation: 'ReLU',
        description: `Fully connected layer with ${neurons} neurons using ReLU activation for non-linear feature extraction`,
      },
      {
        name: `Batch Normalization ${index + 1}`,
        type: 'BatchNorm',
        neurons: neurons,
        description: 'Normalizes activations to improve training stability and convergence speed',
      },
      {
        name: `Dropout ${index + 1}`,
        type: 'Dropout',
        neurons: neurons,
        dropout: 0.3,
        description: 'Randomly drops neurons during training to prevent overfitting',
      }
    ]).flat(),
    {
      name: 'Output Layer',
      type: 'Dense',
      neurons: 1,
      activation: 'Sigmoid (via BCEWithLogitsLoss)',
      description: 'Single neuron for binary classification - outputs logit that is converted to probability via sigmoid',
    },
  ];

  // Calculate total parameters (simplified - real calculation is more complex with batch norm)
  const totalParams = 516609; // From your actual model inspection

  const modelSpecs = [
    { label: 'Total Parameters', value: totalParams.toLocaleString(), icon: Cpu },
    { label: 'Input Features', value: String(metadata.input_features), icon: Layers },
    { label: 'Hidden Layers', value: String(actualArchitecture.length), icon: Layers },
    { label: 'Model Version', value: metadata.model_version || 'N/A', icon: Settings },
    { label: 'Training Samples', value: metadata.training_samples?.toLocaleString() || 'N/A', icon: Cpu },
    { label: 'Validation Samples', value: metadata.validation_samples?.toLocaleString() || 'N/A', icon: Settings },
    { label: 'Test Samples', value: metadata.test_samples?.toLocaleString() || 'N/A', icon: Zap },
    { label: 'Trained Date', value: new Date(metadata.trained_date).toLocaleDateString() || 'N/A', icon: Layers },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl text-slate-900 mb-2">Model Architecture</h1>
        <p className="text-slate-600 text-lg">PyTorch neural network structure deployed via ONNX Runtime</p>
      </div>

      {/* Model Specifications Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {modelSpecs.map((spec, index) => {
          const Icon = spec.icon;
          return (
            <div
              key={index}
              className="group bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-slate-600 text-sm mb-1">{spec.label}</div>
              <div className="text-slate-900 text-lg font-semibold">{spec.value}</div>
            </div>
          );
        })}
      </div>

      {/* Neural Network Visualization */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-xl p-8 mb-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl text-slate-900 mb-2">Neural Network Structure</h2>
          <p className="text-slate-600">Sequential architecture: {actualArchitecture.join(' → ')} → 1</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {modelLayers.map((layer: LayerSpec, index: number) => (
            <div key={index} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Layer Card */}
              <div
                className={`p-6 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  layer.type === 'Dense'
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 hover:border-blue-400'
                    : layer.type === 'BatchNorm'
                    ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-300 hover:border-purple-400'
                    : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 hover:border-orange-400'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      layer.type === 'Dense' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : layer.type === 'BatchNorm'
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                        : 'bg-gradient-to-br from-orange-500 to-orange-600'
                    }`}>
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-900 text-lg font-semibold mb-1">{layer.name}</div>
                      <div className={`inline-block px-3 py-1 rounded-md text-xs uppercase tracking-wide font-semibold ${
                        layer.type === 'Dense'
                          ? 'bg-blue-200 text-blue-800'
                          : layer.type === 'BatchNorm'
                          ? 'bg-purple-200 text-purple-800'
                          : 'bg-orange-200 text-orange-800'
                      }`}>
                        {layer.type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-900 text-2xl font-bold">{layer.neurons}</div>
                    <div className="text-slate-600 text-sm">neurons</div>
                    {layer.activation && (
                      <div className="mt-2 inline-block px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-semibold">
                        {layer.activation}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-slate-700">{layer.description}</p>

                {layer.dropout && (
                  <div className="mt-3 flex items-center gap-2 bg-orange-100 border border-orange-200 text-orange-800 px-4 py-2 rounded-lg text-sm font-semibold">
                    <Zap className="w-4 h-4" />
                    <span>Dropout: {(layer.dropout * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>

              {/* Arrow Connector */}
              {index < modelLayers.length - 1 && (
                <div className="flex justify-center py-4">
                  <div className="flex flex-col items-center">
                    <ArrowDown className="w-6 h-6 text-slate-400" />
                    <div className="w-0.5 h-2 bg-slate-300" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Categories */}
      <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl text-slate-900">Input Features ({metadata.input_features})</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/60 p-5 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Temporal (14 features)</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Month, day of month, day of week</li>
              <li>• Departure & arrival hour/minute</li>
              <li>• Time period flags (morning, evening, rush)</li>
              <li>• Cyclical encodings (sin/cos)</li>
            </ul>
          </div>

          <div className="bg-white/60 p-5 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Geographic (4 features)</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Origin airport (encoded, 330 airports)</li>
              <li>• Destination airport (encoded)</li>
              <li>• Flight distance (calculated)</li>
              <li>• Scheduled elapsed time</li>
            </ul>
          </div>

          <div className="bg-white/60 p-5 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Airline (1 feature)</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Carrier (encoded, 15 carriers)</li>
            </ul>
          </div>

          <div className="bg-white/60 p-5 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Historical Stats (6 features)</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Origin delay rate</li>
              <li>• Destination delay rate</li>
              <li>• Carrier delay rate</li>
              <li>• Route-specific delay rate</li>
              <li>• Origin & dest daily traffic</li>
            </ul>
          </div>

          <div className="bg-white/60 p-5 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Departure Weather (7 features)</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Temperature, dewpoint</li>
              <li>• Pressure (millibars)</li>
              <li>• Wind direction & speed</li>
              <li>• Sky coverage, precipitation</li>
            </ul>
          </div>

          <div className="bg-white/60 p-5 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Arrival Weather (7 features)</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Temperature, dewpoint</li>
              <li>• Pressure (millibars)</li>
              <li>• Wind direction & speed</li>
              <li>• Sky coverage, precipitation</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> All 45 features are automatically generated from just 8 user inputs through feature engineering services in the API.
          </p>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Training Configuration */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl text-slate-900">Training Configuration</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Framework:</strong> PyTorch 2.8.0 with CUDA</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Optimizer:</strong> Adam with learning rate scheduling</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Loss Function:</strong> BCEWithLogitsLoss with class weighting</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Hyperparameter Tuning:</strong> Optuna for automated optimization</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Deployment:</strong> Exported to ONNX for cross-platform inference</span>
            </li>
          </ul>
        </div>

        {/* Regularization Techniques */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl text-slate-900">Regularization</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Dropout (30%):</strong> Prevents overfitting by randomly deactivating neurons</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Batch Normalization:</strong> Improves training stability and convergence</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Early Stopping:</strong> Monitors validation loss to prevent overfitting</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Class Weighting:</strong> Addresses 4:1 imbalance between on-time and delayed flights</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700"><strong>Feature Scaling:</strong> StandardScaler normalization for stable gradients</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}