import { Layers, ArrowDown, Cpu, Zap, Settings } from 'lucide-react';

interface LayerSpec {
  name: string;
  type: string;
  neurons: number;
  activation?: string;
  dropout?: number;
  description: string;
}

const modelLayers: LayerSpec[] = [
  {
    name: 'Input Layer',
    type: 'Dense',
    neurons: 8,
    description: 'Receives 8 input features: day of week, month, day of month, hour, minute, origin airport (encoded), destination airport (encoded), carrier (encoded)',
  },
  {
    name: 'Hidden Layer 1',
    type: 'Dense',
    neurons: 128,
    activation: 'ReLU',
    dropout: 0.3,
    description: 'First hidden layer with ReLU activation for non-linear feature extraction',
  },
  {
    name: 'Batch Normalization 1',
    type: 'BatchNorm',
    neurons: 128,
    description: 'Normalizes activations to improve training stability and speed',
  },
  {
    name: 'Hidden Layer 2',
    type: 'Dense',
    neurons: 64,
    activation: 'ReLU',
    dropout: 0.3,
    description: 'Second hidden layer for deeper feature representation',
  },
  {
    name: 'Batch Normalization 2',
    type: 'BatchNorm',
    neurons: 64,
    description: 'Second batch normalization layer',
  },
  {
    name: 'Hidden Layer 3',
    type: 'Dense',
    neurons: 32,
    activation: 'ReLU',
    dropout: 0.2,
    description: 'Third hidden layer for refined pattern recognition',
  },
  {
    name: 'Output Layer',
    type: 'Dense',
    neurons: 1,
    activation: 'Sigmoid',
    description: 'Binary classification output (delayed vs on-time) with probability score',
  },
];

const modelSpecs = [
  { label: 'Total Parameters', value: '18,305', icon: Cpu },
  { label: 'Trainable Parameters', value: '18,049', icon: Settings },
  { label: 'Non-trainable Parameters', value: '256', icon: Layers },
  { label: 'Model Size', value: '73.2 KB', icon: Zap },
  { label: 'Optimizer', value: 'Adam', icon: Cpu },
  { label: 'Loss Function', value: 'Binary Cross-Entropy', icon: Settings },
  { label: 'Learning Rate', value: '0.001', icon: Zap },
  { label: 'Batch Size', value: '32', icon: Layers },
];

export function ModelArchitecturePage() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl text-slate-900 mb-2">Model Architecture</h1>
        <p className="text-slate-600 text-lg">Deep learning neural network structure and specifications</p>
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
              <div className="text-slate-900 text-lg">{spec.value}</div>
            </div>
          );
        })}
      </div>

      {/* Neural Network Visualization */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-xl p-8 mb-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl text-slate-900 mb-2">Neural Network Structure</h2>
          <p className="text-slate-600">Sequential deep learning architecture with regularization</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {modelLayers.map((layer, index) => (
            <div key={index} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
              {/* Layer Card */}
              <div
                className={`p-6 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  layer.type === 'Dense'
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 hover:border-blue-400'
                    : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-300 hover:border-purple-400'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      layer.type === 'Dense' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-br from-purple-500 to-purple-600'
                    }`}>
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-900 text-lg mb-1">{layer.name}</div>
                      <div className={`inline-block px-3 py-1 rounded-md text-xs uppercase tracking-wide ${
                        layer.type === 'Dense'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-purple-200 text-purple-800'
                      }`}>
                        {layer.type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-900 text-xl">{layer.neurons}</div>
                    <div className="text-slate-600 text-sm">neurons</div>
                    {layer.activation && (
                      <div className="mt-2 inline-block px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                        {layer.activation}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-slate-700 mb-3">{layer.description}</p>

                {layer.dropout && (
                  <div className="flex items-center gap-2 bg-orange-100 border border-orange-200 text-orange-800 px-4 py-2 rounded-lg text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Dropout: {(layer.dropout * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>

              {/* Arrow Connector */}
              {index < modelLayers.length - 1 && (
                <div className="flex justify-center py-6">
                  <div className="flex flex-col items-center">
                    <ArrowDown className="w-6 h-6 text-slate-400 animate-bounce" style={{ animationDuration: '2s' }} />
                    <div className="w-0.5 h-4 bg-slate-300 mt-1" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Feature Engineering */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl text-slate-900">Feature Engineering</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700">Temporal features: day of week, month, day of month, hour, minute</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700">Categorical encoding: one-hot encoding for airports and carriers</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700">Feature normalization: MinMax scaling for numerical features</span>
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
              <span className="text-slate-700">Dropout layers to prevent overfitting</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700">Batch normalization for training stability</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-slate-700">Early stopping based on validation loss</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
