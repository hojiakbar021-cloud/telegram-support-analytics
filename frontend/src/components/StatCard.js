import React from 'react';

function StatCard({ title, value, icon, color, darkMode }) {
  const colorClasses = {
    blue: {
      bg: darkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50',
      icon: darkMode ? 'text-blue-400' : 'text-blue-600',
      border: darkMode ? 'border-blue-700' : 'border-blue-200',
      value: darkMode ? 'text-white' : 'text-gray-900',
      title: darkMode ? 'text-blue-300' : 'text-blue-700',
    },
    green: {
      bg: darkMode ? 'bg-green-900 bg-opacity-30' : 'bg-green-50',
      icon: darkMode ? 'text-green-400' : 'text-green-600',
      border: darkMode ? 'border-green-700' : 'border-green-200',
      value: darkMode ? 'text-white' : 'text-gray-900',
      title: darkMode ? 'text-green-300' : 'text-green-700',
    },
    purple: {
      bg: darkMode ? 'bg-purple-900 bg-opacity-30' : 'bg-purple-50',
      icon: darkMode ? 'text-purple-400' : 'text-purple-600',
      border: darkMode ? 'border-purple-700' : 'border-purple-200',
      value: darkMode ? 'text-white' : 'text-gray-900',
      title: darkMode ? 'text-purple-300' : 'text-purple-700',
    },
    orange: {
      bg: darkMode ? 'bg-orange-900 bg-opacity-30' : 'bg-orange-50',
      icon: darkMode ? 'text-orange-400' : 'text-orange-600',
      border: darkMode ? 'border-orange-700' : 'border-orange-200',
      value: darkMode ? 'text-white' : 'text-gray-900',
      title: darkMode ? 'text-orange-300' : 'text-orange-700',
    },
    red: {
      bg: darkMode ? 'bg-red-900 bg-opacity-30' : 'bg-red-50',
      icon: darkMode ? 'text-red-400' : 'text-red-600',
      border: darkMode ? 'border-red-700' : 'border-red-200',
      value: darkMode ? 'text-white' : 'text-gray-900',
      title: darkMode ? 'text-red-300' : 'text-red-700',
    },
    yellow: {
      bg: darkMode ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-50',
      icon: darkMode ? 'text-yellow-400' : 'text-yellow-600',
      border: darkMode ? 'border-yellow-700' : 'border-yellow-200',
      value: darkMode ? 'text-white' : 'text-gray-900',
      title: darkMode ? 'text-yellow-300' : 'text-yellow-700',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`${colors.bg} ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg border-2 ${colors.border} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.title} mb-1`}>{title}</p>
          <p className={`text-3xl font-bold ${colors.value}`}>
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`${colors.icon} opacity-80`}>{icon}</div>
      </div>
    </div>
  );
}

export default StatCard;
