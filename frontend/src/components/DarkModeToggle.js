import React, { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

function DarkModeToggle({ darkMode, setDarkMode }) {
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setDarkMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setDarkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className={`fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 z-50 group ${
        darkMode
          ? 'bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800'
          : 'bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
      }`}
      style={{
        zIndex: 9999,
        boxShadow: darkMode
          ? '0 10px 40px rgba(99, 102, 241, 0.5)'
          : '0 10px 40px rgba(251, 191, 36, 0.5)',
      }}
      title={darkMode ? "Yorug' rejim (Ctrl+D)" : "Qorong'i rejim (Ctrl+D)"}
    >
      {darkMode ? (
        <Sun className="w-7 h-7 text-white transition-transform duration-300 group-hover:rotate-180" />
      ) : (
        <Moon className="w-7 h-7 text-white transition-transform duration-300 group-hover:rotate-12" />
      )}

      {/* Tooltip */}
      <span className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {darkMode ? "Yorug' rejim" : "Qorong'i rejim"}
        <span className="block text-[10px] text-gray-400 mt-1">Ctrl+D</span>
      </span>
    </button>
  );
}

export default DarkModeToggle;
