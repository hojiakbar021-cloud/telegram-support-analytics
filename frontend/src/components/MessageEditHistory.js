import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

function MessageEditHistory({ messageId, isEdited }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadHistory = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/messages/${messageId}/history/`
      );
      setHistory(response.data.history || []);
      setExpanded(true);
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Edit history yuklanmadi!');
    } finally {
      setLoading(false);
    }
  };

  if (!isEdited) return null;

  return (
    <div className="mt-2">
      <button
        onClick={loadHistory}
        disabled={loading}
        className="flex items-center text-xs text-gray-500 hover:text-blue-600 transition"
      >
        <History className="w-3 h-3 mr-1" />
        {loading ? 'Yuklanmoqda...' : 'Tahrir tarixi'}
        {expanded ? (
          <ChevronUp className="w-3 h-3 ml-1" />
        ) : (
          <ChevronDown className="w-3 h-3 ml-1" />
        )}
      </button>

      {expanded && history.length > 0 && (
        <div className="mt-2 ml-4 space-y-2">
          {history.map((item, index) => (
            <div
              key={item.id}
              className="border-l-2 border-blue-300 pl-3 py-2 bg-blue-50 rounded"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-blue-700">
                  Tahrir #{history.length - index}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(item.edited_at).toLocaleString('uz-UZ')}
                </span>
              </div>

              {/* Old Text */}
              <div className="mb-2">
                <p className="text-xs text-gray-600 mb-1">Eski:</p>
                <p className="text-sm text-gray-700 bg-red-50 p-2 rounded line-through">
                  {item.old_text || "(bo'sh)"}
                </p>
              </div>

              {/* New Text */}
              <div>
                <p className="text-xs text-gray-600 mb-1">Yangi:</p>
                <p className="text-sm text-gray-900 bg-green-50 p-2 rounded">
                  {item.new_text || "(bo'sh)"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && history.length === 0 && (
        <p className="text-xs text-gray-500 mt-2 ml-4">
          Tahrir tarixi topilmadi
        </p>
      )}
    </div>
  );
}

export default MessageEditHistory;
