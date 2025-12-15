import { useState, FormEvent } from 'react';
import { Plane, Calendar, Clock, Building2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { usePrediction, useReferenceData } from '../hooks/useApi';

export function PredictionPage() {
  // Use our custom hooks for API calls
  const { predict, result, loading, error, reset } = usePrediction();
  const { airports, carriers, loading: refDataLoading } = useReferenceData();

  // Form state - controlled components
  const [formData, setFormData] = useState({
    dayOfWeek: new Date().getDay(),
    month: new Date().getMonth() + 1,
    dayOfMonth: new Date().getDate(),
    hour: 12,
    minute: 0,
    originAirport: '',
    destinationAirport: '',
    carrier: '',
  });

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  /**
   * Handle form submission
   * This is an async function that prevents default form behavior
   * and calls our API through the custom hook
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent page reload

    // Validate form
    if (!formData.originAirport || !formData.destinationAirport || !formData.carrier) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Call the API through our custom hook
      await predict({
        dayOfWeek: formData.dayOfWeek,
        month: formData.month,
        dayOfMonth: formData.dayOfMonth,
        hour: formData.hour,
        minute: formData.minute,
        originAirport: formData.originAirport,
        destinationAirport: formData.destinationAirport,
        carrier: formData.carrier,
      });
    } catch (err) {
      // Error is already handled by the hook
      console.error('Prediction failed:', err);
    }
  };

  /**
   * Handle input changes
   * This updates the form state whenever an input value changes
   */
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Reset form and results
   */
  const handleReset = () => {
    setFormData({
      dayOfWeek: new Date().getDay(),
      month: new Date().getMonth() + 1,
      dayOfMonth: new Date().getDate(),
      hour: 12,
      minute: 0,
      originAirport: '',
      destinationAirport: '',
      carrier: '',
    });
    reset();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl text-slate-900 mb-2">Flight Delay Prediction</h1>
        <p className="text-slate-600 text-lg">
          Enter flight details to predict the likelihood of delays
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Input Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-xl p-8">
          <h2 className="text-2xl text-slate-900 mb-6 flex items-center gap-2">
            <Plane className="w-6 h-6 text-blue-600" />
            Flight Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Section */}
            <div className="space-y-4">
              <h3 className="text-lg text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Flight Date
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Day of Week */}
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => handleInputChange('dayOfWeek', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    disabled={loading}
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Month
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    disabled={loading}
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day of Month */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Day of Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => handleInputChange('dayOfMonth', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Time Section */}
            <div className="space-y-4">
              <h3 className="text-lg text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Departure Time
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Hour */}
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Hour (24h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.hour}
                    onChange={(e) => handleInputChange('hour', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    disabled={loading}
                  />
                </div>

                {/* Minute */}
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Minute
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.minute}
                    onChange={(e) => handleInputChange('minute', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Route Section */}
            <div className="space-y-4">
              <h3 className="text-lg text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Route & Carrier
              </h3>

              {/* Origin Airport */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Origin Airport
                </label>
                {refDataLoading ? (
                  <div className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span className="text-slate-500">Loading airports...</span>
                  </div>
                ) : (
                  <select
                    value={formData.originAirport}
                    onChange={(e) => handleInputChange('originAirport', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    disabled={loading}
                    required
                  >
                    <option value="">Select origin airport...</option>
                    {airports.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.code} - {airport.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Destination Airport */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Destination Airport
                </label>
                {refDataLoading ? (
                  <div className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span className="text-slate-500">Loading airports...</span>
                  </div>
                ) : (
                  <select
                    value={formData.destinationAirport}
                    onChange={(e) => handleInputChange('destinationAirport', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    disabled={loading}
                    required
                  >
                    <option value="">Select destination airport...</option>
                    {airports.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.code} - {airport.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Carrier */}
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Carrier
                </label>
                {refDataLoading ? (
                  <div className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span className="text-slate-500">Loading carriers...</span>
                  </div>
                ) : (
                  <select
                    value={formData.carrier}
                    onChange={(e) => handleInputChange('carrier', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    disabled={loading}
                    required
                  >
                    <option value="">Select airline carrier...</option>
                    {carriers.map((carrier) => (
                      <option key={carrier.code} value={carrier.code}>
                        {carrier.code} - {carrier.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || refDataLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <Plane className="w-5 h-5" />
                    Predict Delay
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 animate-in fade-in slide-in-from-right duration-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-red-900 text-lg mb-2">Prediction Failed</h3>
                  <p className="text-red-700">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {result && !loading && !error && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
              {/* Main Result Card */}
              <div
                className={`p-8 rounded-xl border-2 shadow-xl ${
                  result.isDelayed
                    ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                }`}
              >
                <div className="flex items-center gap-4 mb-6">
                  {result.isDelayed ? (
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl text-slate-900 mb-1">
                      {result.isDelayed ? 'Likely Delayed' : 'Likely On-Time'}
                    </h3>
                    <p className="text-slate-600">
                      {(result.confidence * 100).toFixed(1)}% confidence
                    </p>
                  </div>
                </div>

                {/* Probability Bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-700">Delay Probability</span>
                      <span className="text-sm text-slate-900">
                        {(result.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${result.probability * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-700">On-Time Probability</span>
                      <span className="text-sm text-slate-900">
                        {((1 - result.probability) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(1 - result.probability) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Initial State - No prediction yet */}
          {!result && !loading && !error && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-12 text-center">
              <Plane className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-slate-700 text-lg mb-2">Ready to Predict</h3>
              <p className="text-slate-500">
                Fill in the flight details and click "Predict Delay" to see the results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
