import React, { useState, useEffect } from 'react';
import { Users, BarChart3, TrendingUp, Trash2, Edit } from 'lucide-react';
import axios from 'axios';

function GroupComparison({ darkMode }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        'http://localhost:8000/api/stats/group-comparison/'
      );

      if (response.data.status === 'success') {
        setGroups(response.data.groups || []);
      } else {
        setError("Ma'lumot yuklashda xatolik");
      }
    } catch (err) {
      console.error('Error loading groups:', err);
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow mb-8`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/4"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow mb-8`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Guruhlar Bo'yicha Solishtirish
        </h3>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadGroups}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow mb-8`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Guruhlar Bo'yicha Solishtirish
        </h3>
        <p
          className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
        >
          Hozircha guruh ma'lumotlari yo'q
        </p>
      </div>
    );
  }

  const maxMessages = Math.max(...groups.map((g) => g.message_count));

  return (
    <div
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow mb-8`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className={`text-lg font-semibold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          <Users className="w-5 h-5 mr-2 text-indigo-600" />
          Guruhlar Bo'yicha Solishtirish
        </h3>
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {groups.length} ta guruh
        </span>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        {groups.map((group, index) => (
          <div
            key={group.id}
            className={`p-5 rounded-lg transition-all ${
              index === 0
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 shadow-lg'
                : darkMode
                  ? 'bg-gray-700 hover:bg-gray-650 border border-gray-600'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {/* Group Name + Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {index === 0 && <span className="text-3xl mr-3">🏆</span>}
                {index === 1 && <span className="text-2xl mr-3">🥈</span>}
                {index === 2 && <span className="text-2xl mr-3">🥉</span>}
                <div>
                  <h4
                    className={`text-lg font-bold ${
                      index === 0
                        ? 'text-gray-900'
                        : darkMode
                          ? 'text-white'
                          : 'text-gray-900'
                    }`}
                  >
                    {group.name}
                  </h4>
                  <p
                    className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    ID: {group.id}
                  </p>
                </div>
              </div>
              {index === 0 && (
                <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                  TOP
                </span>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              {/* Messages */}
              <div
                className={`p-3 rounded-lg text-center ${
                  darkMode && index !== 0 ? 'bg-gray-600' : 'bg-blue-100'
                }`}
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <p
                  className={`text-xl font-bold ${
                    darkMode && index !== 0 ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {group.message_count}
                </p>
                <p
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Xabarlar
                </p>
              </div>

              {/* Users */}
              <div
                className={`p-3 rounded-lg text-center ${
                  darkMode && index !== 0 ? 'bg-gray-600' : 'bg-green-100'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1 text-green-600" />
                <p
                  className={`text-xl font-bold ${
                    darkMode && index !== 0 ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {group.user_count}
                </p>
                <p
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Foydalanuvchilar
                </p>
              </div>

              {/* Average */}
              <div
                className={`p-3 rounded-lg text-center ${
                  darkMode && index !== 0 ? 'bg-gray-600' : 'bg-purple-100'
                }`}
              >
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                <p
                  className={`text-xl font-bold ${
                    darkMode && index !== 0 ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {group.avg_messages_per_user}
                </p>
                <p
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  O'rtacha
                </p>
              </div>

              {/* Deleted */}
              <div
                className={`p-3 rounded-lg text-center ${
                  darkMode && index !== 0 ? 'bg-gray-600' : 'bg-red-100'
                }`}
              >
                <Trash2 className="w-5 h-5 mx-auto mb-1 text-red-600" />
                <p
                  className={`text-xl font-bold ${
                    darkMode && index !== 0 ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {group.deleted_count}
                </p>
                <p
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  O'chirilgan
                </p>
              </div>

              {/* Edited */}
              <div
                className={`p-3 rounded-lg text-center ${
                  darkMode && index !== 0 ? 'bg-gray-600' : 'bg-orange-100'
                }`}
              >
                <Edit className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                <p
                  className={`text-xl font-bold ${
                    darkMode && index !== 0 ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {group.edited_count}
                </p>
                <p
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Tahrirlangan
                </p>
              </div>
            </div>

            {/* Media Types */}
            {group.media_distribution &&
              group.media_distribution.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p
                    className={`text-xs font-semibold mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Media:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.media_distribution.map((media, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 text-xs rounded-full ${
                          darkMode
                            ? 'bg-gray-600 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {media.media_type}: {media.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Progress Bar */}
            <div
              className={`w-full mt-4 ${
                darkMode ? 'bg-gray-600' : 'bg-gray-200'
              } rounded-full h-2`}
            >
              <div
                className={`h-2 rounded-full transition-all duration-700 ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600'
                }`}
                style={{
                  width: `${(group.message_count / maxMessages) * 100}%`,
                }}
              ></div>
            </div>
            <p
              className={`text-xs text-right mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {((group.message_count / maxMessages) * 100).toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupComparison;
