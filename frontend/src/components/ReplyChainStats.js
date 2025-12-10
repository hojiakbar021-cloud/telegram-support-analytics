import React, { useState, useEffect } from 'react';
import { MessageCircle, TrendingUp, Award } from 'lucide-react';
import axios from 'axios';

function ReplyChainStats({ darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8000/api/stats/reply-chain/'
      );
      setData(response.data);
    } catch (error) {
      console.error('Error loading reply chain stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>;
  if (!data) return null;

  return (
    <div
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow mb-8`}
    >
      <h3
        className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : ''}`}
      >
        <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
        Reply Chain Analytics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}
        >
          <p
            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Jami Reply'lar
          </p>
          <p
            className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}
          >
            {data.total_replies || 0}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}
        >
          <p
            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Reply Rate
          </p>
          <p
            className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-green-600'}`}
          >
            {data.reply_rate ? `${data.reply_rate}%` : '0%'}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}
        >
          <p
            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            O'rtacha Chain
          </p>
          <p
            className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-purple-600'}`}
          >
            {data.avg_chain_length ? data.avg_chain_length.toFixed(1) : '0'}
          </p>
        </div>
      </div>

      {data.top_replied && data.top_replied.length > 0 && (
        <div>
          <h4
            className={`text-md font-semibold mb-3 flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
          >
            <Award className="w-4 h-4 mr-2" />
            Eng Ko'p Reply Olingan Xabarlar
          </h4>
          <div className="space-y-2">
            {data.top_replied.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p
                      className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      {item.text
                        ? item.text.length > 100
                          ? `${item.text.substring(0, 100)}...`
                          : item.text
                        : '[Media xabar]'}
                    </p>
                    <p
                      className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
                    >
                      Message ID: {item.message_id}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-700">
                      {item.reply_count} reply
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReplyChainStats;
