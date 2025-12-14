import { useState } from 'react';
import { Search, Download, Database, TrendingUp, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useTrainingData, useDatasetStats } from '../hooks/useApi';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TrainingDataPage() {
  // Local state for pagination and search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // Fetch data using our custom hooks
  // These hooks automatically handle loading, errors, and data updates
  const { data, total, loading, error, refetch } = useTrainingData(
    currentPage,
    rowsPerPage,
    searchTerm || undefined
  );

  const { stats, loading: statsLoading } = useDatasetStats();

  // Calculate total pages based on API response
  const totalPages = Math.ceil(total / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;

  /**
   * Error State UI
   * Shows when API request fails
   */
  if (error && !loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-4xl text-slate-900 mb-2">Training Dataset</h1>
          <p className="text-slate-600 text-lg">Comprehensive dataset used to train the flight delay prediction model</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-red-900 text-lg mb-2">Failed to Load Training Data</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl text-slate-900 mb-2">Training Dataset</h1>
        <p className="text-slate-600 text-lg">Comprehensive dataset used to train the flight delay prediction model</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Records Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Database className="w-6 h-6" />
              </div>
              <div className="text-blue-100 uppercase tracking-wide text-sm">Total Records</div>
            </div>
            {statsLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <div className="text-5xl mb-2">{stats?.totalRecords.toLocaleString() || '0'}</div>
                <div className="text-blue-100">Training samples</div>
              </>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        </div>

        {/* Delayed Flights Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 text-white p-8 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-red-100 uppercase tracking-wide text-sm">Delayed Flights</div>
            </div>
            {statsLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <div className="text-5xl mb-2">{stats?.delayedCount.toLocaleString() || '0'}</div>
                <div className="text-red-100">
                  {stats ? ((stats.delayedCount / stats.totalRecords) * 100).toFixed(1) : '0'}% of total
                </div>
              </>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        </div>

        {/* On-Time Flights Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-green-100 uppercase tracking-wide text-sm">On-Time Flights</div>
            </div>
            {statsLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <div className="text-5xl mb-2">{stats?.onTimeCount.toLocaleString() || '0'}</div>
                <div className="text-green-100">
                  {stats ? ((stats.onTimeCount / stats.totalRecords) * 100).toFixed(1) : '0'}% of total
                </div>
              </>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        </div>
      </div>

      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by airport or carrier..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none hover:border-slate-400 shadow-sm"
          />
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
          <Download className="w-5 h-5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-slate-700 text-sm uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-slate-700 text-sm uppercase tracking-wider">Day</th>
                <th className="px-6 py-4 text-left text-slate-700 text-sm uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-slate-700 text-sm uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-slate-700 text-sm uppercase tracking-wider">Origin</th>
                <th className="px-6 py-4 text-left text-slate-700 text-sm uppercase tracking-wider">Destination</th>
                <th className="px-6 py-4 text-left text-slate-700 text-sm uppercase tracking-wider">Carrier</th>
                <th className="px-6 py-4 text-left text-slate-700 text-sm uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // Loading state - show skeleton rows
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-slate-600">Loading training data...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                // Empty state - no results found
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-slate-600">No training data found matching your search.</p>
                  </td>
                </tr>
              ) : (
                // Data rows
                data.map((row, idx) => (
                  <tr 
                    key={row.id} 
                    className={`hover:bg-blue-50/50 transition-colors duration-150 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    <td className="px-6 py-4 text-slate-600">{row.id}</td>
                    <td className="px-6 py-4 text-slate-600">{daysOfWeek[row.dayOfWeek]}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.month}/{row.dayOfMonth}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {String(row.hour).padStart(2, '0')}:{String(row.minute).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-100 text-blue-800 text-sm shadow-sm">
                        {row.originAirport}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-md bg-purple-100 text-purple-800 text-sm shadow-sm">
                        {row.destinationAirport}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{row.carrier}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm shadow-sm ${
                          row.delayed
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {row.delayed ? 'Delayed' : 'On Time'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-600 text-sm">
            Showing <span className="text-slate-900">{startIndex + 1}</span> to{' '}
            <span className="text-slate-900">{Math.min(startIndex + rowsPerPage, total)}</span> of{' '}
            <span className="text-slate-900">{total}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 bg-white shadow-sm"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'border border-slate-300 hover:bg-white text-slate-700 bg-white shadow-sm'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 bg-white shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
