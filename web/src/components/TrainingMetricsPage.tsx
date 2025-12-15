import { useTrainingHistory, useModelMetadata, useTestResults } from '../hooks/useApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Award, Clock, Activity, Loader2, AlertCircle } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f97316', '#ef4444'];

export function TrainingMetricsPage() {
  // Fetch real data from API
  const { data: historyData, loading: historyLoading, error: historyError } = useTrainingHistory();
  const { data: metadataData, loading: metadataLoading, error: metadataError } = useModelMetadata();
  const { data: testData, loading: testLoading, error: testError } = useTestResults();

  const loading = historyLoading || metadataLoading || testLoading;
  const error = historyError || metadataError || testError;

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading training metrics...</p>
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
          <h2 className="text-xl text-slate-900 mb-2">Failed to load training metrics</h2>
          <p className="text-slate-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!historyData || !metadataData || !testData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">No training data available</p>
      </div>
    );
  }

  // Transform data for Recharts
  const trainingHistory = historyData.train_loss.map((_, index) => ({
    epoch: index + 1,
    trainLoss: historyData.train_loss[index],
    valLoss: historyData.val_loss[index],
    trainAccuracy: historyData.train_acc[index],
    valAccuracy: historyData.val_acc[index],
    valF1: historyData.val_f1?.[index] || 0,
    valRocAuc: historyData.val_roc_auc?.[index] || 0,
  }));

  const finalMetrics = trainingHistory[trainingHistory.length - 1];
  
  // Test metrics from API
  const totalEpochs = trainingHistory.length;
  const bestEpoch = metadataData.epochs_trained || totalEpochs;
  
  // Confusion matrix from test results
  const confusionMatrix = [
    { 
      category: 'True Positive', 
      value: testData.confusion_matrix.true_positives, 
      color: '#10b981', 
      label: 'TP' 
    },
    { 
      category: 'True Negative', 
      value: testData.confusion_matrix.true_negatives, 
      color: '#3b82f6', 
      label: 'TN' 
    },
    { 
      category: 'False Positive', 
      value: testData.confusion_matrix.false_positives, 
      color: '#f97316', 
      label: 'FP' 
    },
    { 
      category: 'False Negative', 
      value: testData.confusion_matrix.false_negatives, 
      color: '#ef4444', 
      label: 'FN' 
    },
  ];

  const totalPredictions = confusionMatrix.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl text-slate-900 mb-2">Training Metrics</h1>
        <p className="text-slate-600 text-lg">Final model performance on completely unseen test data</p>
      </div>

      {/* Key Test Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-blue-100 text-sm uppercase tracking-wide">Test Accuracy</div>
            </div>
            <div className="text-4xl mb-1">{testData.test_accuracy.toFixed(2)}%</div>
            <div className="text-blue-100 text-sm">Final test set performance</div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-orange-100 text-sm uppercase tracking-wide">Test F1 Score</div>
            </div>
            <div className="text-4xl mb-1">{(testData.test_f1 * 100).toFixed(2)}%</div>
            <div className="text-orange-100 text-sm">Primary success metric</div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-purple-100 text-sm uppercase tracking-wide">Test ROC-AUC</div>
            </div>
            <div className="text-4xl mb-1">{(testData.test_roc_auc * 100).toFixed(2)}%</div>
            <div className="text-purple-100 text-sm">Classification quality</div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-green-100 text-sm uppercase tracking-wide">Test Precision</div>
            </div>
            <div className="text-4xl mb-1">{(testData.test_precision * 100).toFixed(2)}%</div>
            <div className="text-green-100 text-sm">Positive predictive value</div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
        </div>
      </div>

      {/* Training Progress Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Loss Chart */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Training & Validation Loss</h2>
            <p className="text-slate-600 text-sm">Loss convergence over {totalEpochs} epochs</p>
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
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => value.toFixed(4)}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="trainLoss" 
                stroke="#3b82f6" 
                name="Training Loss" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="valLoss" 
                stroke="#ef4444" 
                name="Validation Loss" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Final Test Loss:</strong> {testData.test_loss.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Accuracy Chart */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Training & Validation Accuracy</h2>
            <p className="text-slate-600 text-sm">Accuracy improvement over {totalEpochs} epochs</p>
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
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => `${value.toFixed(2)}%`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="trainAccuracy" 
                stroke="#10b981" 
                name="Training Accuracy" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="valAccuracy" 
                stroke="#8b5cf6" 
                name="Validation Accuracy" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Final Test Accuracy:</strong> {testData.test_accuracy.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* F1 Score Chart */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Validation F1 Score Progress</h2>
            <p className="text-slate-600 text-sm">F1 score improvement over {totalEpochs} epochs</p>
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
                label={{ value: 'F1 Score', angle: -90, position: 'insideLeft' }}
                stroke="#64748b"
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => value.toFixed(4)}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="valF1" 
                stroke="#f59e0b" 
                name="Validation F1" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-900">
              <strong>Final Test F1:</strong> {(testData.test_f1 * 100).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* ROC-AUC Chart */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Validation ROC-AUC Score</h2>
            <p className="text-slate-600 text-sm">Classification quality over {totalEpochs} epochs</p>
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
                label={{ value: 'ROC-AUC', angle: -90, position: 'insideLeft' }}
                stroke="#64748b"
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => value.toFixed(4)}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="valRocAuc" 
                stroke="#8b5cf6" 
                name="Validation ROC-AUC" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900">
              <strong>Final Test ROC-AUC:</strong> {(testData.test_roc_auc * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Test Set Confusion Matrix</h2>
            <p className="text-slate-600 text-sm">Classification breakdown on {testData.test_samples.toLocaleString()} test samples</p>
          </div>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={confusionMatrix}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value, percent }) => `${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
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

        {/* Additional Test Metrics */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl text-slate-900 mb-1">Detailed Test Metrics</h2>
            <p className="text-slate-600 text-sm">Performance breakdown</p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 mb-1">Precision</div>
              <div className="text-2xl text-blue-900">{(testData.test_precision * 100).toFixed(2)}%</div>
              <div className="text-xs text-blue-700 mt-1">Of predicted delays, how many were correct</div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 mb-1">Recall (Sensitivity)</div>
              <div className="text-2xl text-purple-900">{(testData.test_recall * 100).toFixed(2)}%</div>
              <div className="text-xs text-purple-700 mt-1">Of actual delays, how many did we catch</div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 mb-1">Specificity</div>
              <div className="text-2xl text-green-900">{(testData.test_specificity * 100).toFixed(2)}%</div>
              <div className="text-xs text-green-700 mt-1">Of actual on-time, how many did we catch</div>
            </div>
          </div>
        </div>
      </div>

      {/* Training Summary */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-xl border border-indigo-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl text-slate-900">Training & Testing Summary</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-slate-900 mb-4 text-lg">Training Configuration</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Total Epochs</span>
                <span className="text-slate-900">{totalEpochs}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Best Epoch</span>
                <span className="text-slate-900">{bestEpoch}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Model Version</span>
                <span className="text-slate-900">{metadataData.model_version || testData.model_version}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Test Samples</span>
                <span className="text-slate-900">{testData.test_samples.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-slate-900 mb-4 text-lg">Final Test Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Test Loss</span>
                <span className="text-slate-900">{testData.test_loss.toFixed(4)}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Test Accuracy</span>
                <span className="text-slate-900">{testData.test_accuracy.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Test F1 Score</span>
                <span className="text-slate-900 font-semibold">{(testData.test_f1 * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between p-3 bg-white/60 rounded-lg">
                <span className="text-slate-600">Test ROC-AUC</span>
                <span className="text-slate-900">{(testData.test_roc_auc * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white/60 rounded-lg border border-indigo-300">
          <p className="text-sm text-slate-700">
            <strong>Note:</strong> These test metrics represent the model's performance on completely unseen data that was never used during training or hyperparameter tuning. This is the true measure of generalization capability.
          </p>
        </div>
      </div>
    </div>
  );
}