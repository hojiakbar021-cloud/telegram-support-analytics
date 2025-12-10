import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function GeminiInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        'http://localhost:8000/api/ai/insights/'
      );
      setInsights(response.data);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('AI insights yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg shadow">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white">
          <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
          AI Insights
        </h3>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium rounded-full flex items-center">
            ✨ Google Gemini
          </span>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="p-1 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>{insights?.message_count || 0} xabar tahlil qilindi</span>
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          <span>{insights?.period || 'Oxirgi 7 kun'}</span>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{insights?.insights || ''}</ReactMarkdown>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
        Yaratilgan:{' '}
        {insights?.generated_at
          ? new Date(insights.generated_at).toLocaleString('uz-UZ')
          : ''}
      </div>

      <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 text-right">
        Powered by {insights?.powered_by || 'Google Gemini AI'}
      </div>
    </div>
  );
}

export default GeminiInsights;
