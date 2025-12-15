import { useState } from 'react';
import { PredictionPage } from './components/PredictionPage';
import { TrainingDataPage } from './components/TrainingDataPage';
import { ModelArchitecturePage } from './components/ModelArchitecturePage';
import { TrainingMetricsPage } from './components/TrainingMetricsPage';
import { Brain, Database, Network, TrendingUp, Menu, X } from 'lucide-react';

type TabType = 'prediction' | 'data' | 'architecture' | 'metrics';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('prediction');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = [
    { id: 'prediction' as TabType, label: 'Prediction', icon: Brain },
    { id: 'metrics' as TabType, label: 'Training Metrics', icon: TrendingUp },
    { id: 'architecture' as TabType, label: 'Model Architecture', icon: Network },
    ///{ id: 'data' as TabType, label: 'Training Data', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed lg:sticky top-0 h-screen w-[280px] bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl z-40 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-6">
            {/* Logo/Brand Area */}
            <div className="mb-8 pb-6 border-b border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white text-xl">FlightAI</h1>
                  <p className="text-slate-400 text-xs">Delay Predictor</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Status Indicator */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Model Active</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-screen">
          <div className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl">
            {activeTab === 'prediction' && <PredictionPage />}
            {activeTab === 'metrics' && <TrainingMetricsPage />}
            {activeTab === 'architecture' && <ModelArchitecturePage />}
            {activeTab === 'data' && <TrainingDataPage />}
          </div>
        </main>
      </div>
    </div>
  );
}