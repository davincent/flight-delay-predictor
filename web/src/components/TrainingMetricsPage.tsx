import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Award, Clock, Activity } from 'lucide-react';

// Mock training history data
const trainingHistory = Array.from({ length: 50 }, (_, i) => ({
  epoch: i + 1,
  trainLoss: 0.65 * Math.exp(-i * 0.08) + 0.15 + (Math.random() - 0.5) * 0.02,
  valLoss: 0.65 * Math.exp(-i * 0.08) + 0.18 + (Math.random() - 0.5) * 0.03,
  trainAccuracy: (1 - 0.7 * Math.exp(-i * 0.08)) * 100,
  valAccuracy: (1 - 0.72 * Math.exp(-i * 0.08)) * 100,
}));

const confusionMatrix = [
  { category: 'True Positive', value: 3420, color: '#10b981', label: 'TP' },
  { category: 'True Negative', value: 5180, color: '#3b82f6', label: 'TN' },
  { category: 'False Positive', value: 320, color: '#f97316', label: 'FP' },
  { category: 'False Negative', value: 280, color: '#ef4444', label: 'FN' },
];

const metricsByCarrier = [
  { carrier: 'AA', accuracy: 87.2, precision: 85.4, recall: 89.1 },
  { carrier: 'DL', accuracy: 89.5, precision: 88.3, recall: 90.8 },
  { carrier: 'UA', accuracy: 86.8, precision: 84.9, recall: 88.5 },
  { carrier: 'WN', accuracy: 88.1, precision: 86.7, recall: 89.4 },
  { carrier: 'B6', accuracy: 85.9, precision: 83.8, recall: 87.9 },
];

const COLORS = ['#10b981', '#3b82f6', '#f97316', '#ef4444'];

export function TrainingMetricsPage() {
  const finalMetrics = trainingHistory[trainingHistory.length - 1];
  const totalPredictions = confusionMatrix.reduce((sum, item) => sum + item.value, 0);
  const accuracy = ((confusionMatrix[0].value + confusionMatrix[1].value) / totalPredictions) * 100;
  const precision = (confusionMatrix[0].value / (confusionMatrix[0].value + confusionMatrix[2].value)) * 100;
  const recall = (confusionMatrix[0].value / (confusionMatrix[0].value + confusionMatrix[3].value)) * 100;
  const f1Score = (2 * precision * recall) / (precision + recall);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl text-slate-900 mb-2">Training Metrics</h1>
        <p className="text-slate-600 text-lg">Performance evaluation and training progress of the model</p>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-blue-100 text-sm uppercase tracking-wide">Accuracy</div>
            </div>
            <div className="text-4xl mb-1">{accuracy.toFixed(2)}%</div>
            <div className="text-blue-100 text-sm">Overall model accuracy</div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-green-100 text-sm uppercase tracking-wide">Precision</div>
            </div>
            <div className="text-4xl mb-1">{precision.toFixed(2)}%</div>
            <div className="text-green-100 text-sm">Positive predictive value</div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-purple-100 text-sm uppercase tracking-wide">Recall</div>
            </div>
            <div className="text-4xl mb-1">{recall.toFixed(2)}%</div>
            <div className="text-purple-100 text-sm">True positive rate</div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-orange-100 text-sm uppercase tracking-wide">F1 Score</div>
            </div>
            <div className="text-4xl mb-1">{f1Score.toFixed(2)}%</div>
            <div className="text-orange-100 text-sm">Harmonic mean</div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
        </div>
      </div>

      {/* Training Progress Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Loss Chart */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Training Loss</h2>
            <p className="text-slate-600 text-sm">Loss convergence over epochs</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trainingHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="epoch" 
                label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                stroke="#64748b"
              />
              <YAxis 
                label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
                stroke="#64748b"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="trainLoss" 
                stroke="#3b82f6" 
                name="Training Loss" 
                strokeWidth={3}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="valLoss" 
                stroke="#ef4444" 
                name="Validation Loss" 
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Accuracy Chart */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Training Accuracy</h2>
            <p className="text-slate-600 text-sm">Accuracy improvement over epochs</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trainingHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="epoch" 
                label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                stroke="#64748b"
              />
              <YAxis 
                label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                stroke="#64748b"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="trainAccuracy" 
                stroke="#10b981" 
                name="Training Accuracy" 
                strokeWidth={3}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="valAccuracy" 
                stroke="#8b5cf6" 
                name="Validation Accuracy" 
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix and Carrier Performance */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Confusion Matrix */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Confusion Matrix</h2>
            <p className="text-slate-600 text-sm">Classification breakdown</p>
          </div>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={confusionMatrix}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value, percent }) => `${value} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {confusionMatrix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-4 mt-6 w-full">
              {confusionMatrix.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                  <div>
                    <div className="text-slate-900 text-sm">{item.category}</div>
                    <div className="text-slate-600 text-xs">{item.value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance by Carrier */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Performance by Carrier</h2>
            <p className="text-slate-600 text-sm">Metrics comparison across airlines</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={metricsByCarrier}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="carrier" stroke="#64748b" />
              <YAxis domain={[80, 95]} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy" radius={[4, 4, 0, 0]} />
              <Bar dataKey="precision" fill="#10b981" name="Precision" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recall" fill="#8b5cf6" name="Recall" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Training Summary */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-xl border border-indigo-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl text-slate-900">Training Summary</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-slate-900 mb-4 text-lg">Training Configuration</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Total Epochs</span>
                <span className="text-slate-900">50</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Best Epoch</span>
                <span className="text-slate-900">47</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Training Time</span>
                <span className="text-slate-900">2h 34m</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Hardware</span>
                <span className="text-slate-900">NVIDIA Tesla T4</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-slate-900 mb-4 text-lg">Final Model Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Final Training Loss</span>
                <span className="text-slate-900">{finalMetrics.trainLoss.toFixed(4)}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Final Validation Loss</span>
                <span className="text-slate-900">{finalMetrics.valLoss.toFixed(4)}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Training Accuracy</span>
                <span className="text-slate-900">{finalMetrics.trainAccuracy.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Validation Accuracy</span>
                <span className="text-slate-900">{finalMetrics.valAccuracy.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
