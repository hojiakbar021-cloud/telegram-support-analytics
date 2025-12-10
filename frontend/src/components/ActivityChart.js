import React, { useState, useEffect } from 'react';
import { Activity, Clock, Calendar } from 'lucide-react';
import axios from 'axios';

function ActivityChart({ darkMode }) {
  const [dailyData, setDailyData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dailyResponse, hourlyResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/stats/messages-per-day/?days=7'),
        axios.get('http://localhost:8000/api/stats/messages-per-hour/'),
      ]);

      const processedDaily = (dailyResponse.data || []).map((item) => {
        const date = new Date(item.date);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return {
          ...item,
          day_name: dayNames[date.getDay()],
          display_date: date.getDate(),
        };
      });

      const processedHourly = (hourlyResponse.data || []).map((item) => {
        const hour = new Date(item.hour).getHours();
        return {
          hour: hour,
          count: item.count,
        };
      });

      console.log('📊 Daily Data:', processedDaily);
      console.log('🕐 Hourly Data:', processedHourly);

      setDailyData(processedDaily);
      setHourlyData(processedHourly);
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxDaily = Math.max(...dailyData.map((d) => d.count || 0), 1);
  const maxHourly = Math.max(...hourlyData.map((d) => d.count || 0), 1);

  const totalDaily = dailyData.reduce((sum, d) => sum + (d.count || 0), 0);
  const avgPerDay =
    dailyData.length > 0 ? Math.round(totalDaily / dailyData.length) : 0;
  const peakHour = hourlyData.reduce(
    (max, d) => (d.count > max.count ? d : max),
    { hour: 0, count: 0 }
  );

  const MAX_HEIGHT = 200; // pixels

  if (loading) {
    return (
      <div className="mb-8">
        <div
          className={`animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-80 rounded-lg`}
        ></div>
      </div>
    );
  }

  return (
    <div
      className={`mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity
            className={`w-6 h-6 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
          />
          <h3
            className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Aktivlik Grafigi
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Kunlik
          </button>
          <button
            onClick={() => setActiveTab('hourly')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'hourly'
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Soatlik
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}
        >
          <p
            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Jami xabarlar
          </p>
          <p
            className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {activeTab === 'daily'
              ? totalDaily
              : hourlyData.reduce((sum, d) => sum + d.count, 0)}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}
        >
          <p
            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {activeTab === 'daily' ? "O'rtacha" : 'Eng faol'}
          </p>
          <p
            className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {activeTab === 'daily' ? avgPerDay : `${peakHour.hour}:00`}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}
        >
          <p
            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Eng ko'p
          </p>
          <p
            className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {activeTab === 'daily' ? maxDaily : maxHourly}
          </p>
        </div>
      </div>

      {/* Chart Area - FIXED HEIGHT */}
      <div style={{ height: `${MAX_HEIGHT + 50}px` }} className="relative">
        {activeTab === 'daily' ? (
          <div className="h-full flex items-end justify-around gap-2 pb-10">
            {dailyData.length > 0 ? (
              dailyData.map((day, index) => {
                const barHeight = Math.max(
                  (day.count / maxDaily) * MAX_HEIGHT,
                  4
                );

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group"
                  >
                    <div
                      className="relative w-full flex justify-center"
                      style={{ height: `${MAX_HEIGHT}px` }}
                    >
                      <div className="absolute bottom-0 w-full flex flex-col items-center">
                        {/* Tooltip */}
                        <div
                          className={`mb-2 px-3 py-1 rounded shadow-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
                            darkMode
                              ? 'bg-gray-700 text-white'
                              : 'bg-gray-900 text-white'
                          }`}
                        >
                          {day.count} xabar
                        </div>

                        {/* Bar - ABSOLUTE HEIGHT */}
                        <div
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer shadow-lg"
                          style={{ height: `${barHeight}px` }}
                        ></div>
                      </div>
                    </div>

                    {/* Label */}
                    <div className="mt-2 text-center absolute bottom-0">
                      <p
                        className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        {day.day_name}
                      </p>
                      <p
                        className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
                      >
                        {day.display_date}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p
                  className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  Ma'lumot yo'q
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-end justify-around gap-1 pb-8">
            {hourlyData.length > 0 ? (
              hourlyData.map((item, index) => {
                const barHeight = Math.max(
                  (item.count / maxHourly) * MAX_HEIGHT,
                  4
                );
                const showLabel = item.hour % 3 === 0;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group"
                  >
                    <div
                      className="relative w-full flex justify-center"
                      style={{ height: `${MAX_HEIGHT}px` }}
                    >
                      <div className="absolute bottom-0 w-full flex flex-col items-center">
                        {/* Tooltip */}
                        <div
                          className={`mb-1 px-2 py-1 rounded shadow-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
                            darkMode
                              ? 'bg-gray-700 text-white'
                              : 'bg-gray-900 text-white'
                          }`}
                        >
                          {item.hour}:00 - {item.count}
                        </div>

                        {/* Bar - ABSOLUTE HEIGHT */}
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t hover:from-purple-700 hover:to-purple-500 transition-all cursor-pointer shadow"
                          style={{ height: `${barHeight}px` }}
                        ></div>
                      </div>
                    </div>

                    {/* Label */}
                    {showLabel && (
                      <p
                        className={`mt-1 text-xs absolute bottom-0 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {item.hour}:00
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p
                  className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  Ma'lumot yo'q
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <p
        className={`text-xs text-center mt-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
      >
        {activeTab === 'daily'
          ? `Oxirgi 7 kun • Jami: ${totalDaily} xabar`
          : `Eng faol: ${peakHour.hour}:00 (${peakHour.count} xabar)`}
      </p>
    </div>
  );
}

export default ActivityChart;
