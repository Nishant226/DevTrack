import { useState, useEffect } from 'react';
import API from '../services/api';
import { BarChart3, CheckCircle2, Clock, Layers } from 'lucide-react';

const AnalyticsDashboard = ({ projectId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]); // Jab bhi project change hoga, yeh automatically naya data fetch karega

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // ProjectId ko query parameter mein bhej rahe hain
      const { data } = await API.get('/analytics', {
        params: { projectId: projectId || '' }
      });
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-400 text-center">Loading analytics...</div>;
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" /> Project Analytics & Metrics
        </h2>
        <button 
          onClick={fetchAnalytics}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
        >
          Refresh Stats
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Tasks */}
        <div className="bg-gray-800/60 border border-gray-700/60 p-4 rounded-xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium">Total Tasks</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalTasks}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-gray-800/60 border border-gray-700/60 p-4 rounded-xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium">Completed</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.statusBreakdown.completed}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-gray-800/60 border border-gray-700/60 p-4 rounded-xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium">In Progress</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.statusBreakdown.inProgress}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-gray-800/60 border border-gray-700/60 p-4 rounded-xl backdrop-blur-sm flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium">Completion Rate</p>
            <h3 className="text-2xl font-bold text-purple-400 mt-1">{stats.completionRate}%</h3>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Detailed Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Breakdown */}
        <div className="bg-gray-800/40 border border-gray-700/60 p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            Status Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">To Do</span>
              <span className="font-semibold text-white bg-gray-700/50 px-2 py-0.5 rounded">{stats.statusBreakdown.toDo}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">In Progress</span>
              <span className="font-semibold text-white bg-gray-700/50 px-2 py-0.5 rounded">{stats.statusBreakdown.inProgress}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">In Review</span>
              <span className="font-semibold text-white bg-gray-700/50 px-2 py-0.5 rounded">{stats.statusBreakdown.inReview}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Completed</span>
              <span className="font-semibold text-white bg-gray-700/50 px-2 py-0.5 rounded">{stats.statusBreakdown.completed}</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-gray-800/40 border border-gray-700/60 p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            Priority Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-rose-400 font-medium">High Priority</span>
              <span className="font-semibold text-white bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">{stats.priorityBreakdown.high}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-amber-400 font-medium">Medium Priority</span>
              <span className="font-semibold text-white bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">{stats.priorityBreakdown.medium}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-400 font-medium">Low Priority</span>
              <span className="font-semibold text-white bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">{stats.priorityBreakdown.low}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AnalyticsDashboard;