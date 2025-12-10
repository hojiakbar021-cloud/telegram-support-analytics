import React, { useState, useEffect } from 'react';
import {
  Filter,
  X,
  Search,
  Calendar,
  User,
  Hash,
  SmilePlus,
} from 'lucide-react';
import axios from 'axios';

function Filters({ darkMode, onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [filters, setFilters] = useState({
    user: '',
    group: '',
    dateFrom: '',
    dateTo: '',
    topic: '',
    sentiment: '',
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8000/api/messages/?page_size=1000'
      );
      const messages = response.data.results || response.data || [];

      console.log('📦 Total messages loaded:', messages.length);

      // ✅ Get unique groups from nested object
      const groupSet = new Set();
      messages.forEach((msg) => {
        // ✅ Nested group.title
        const groupName = msg.group?.title || msg.group?.name || msg.group_name;
        if (groupName) {
          groupSet.add(groupName);
        }
      });
      const groupList = Array.from(groupSet).sort();
      setGroups(groupList);
      console.log('✅ Groups:', groupList);

      // ✅ Get unique users from nested object
      const userMap = new Map(); // username -> display name
      messages.forEach((msg) => {
        // ✅ Nested user.full_name, user.first_name, user.username
        const userName =
          msg.user?.full_name ||
          msg.user?.first_name ||
          msg.user?.username ||
          msg.user_name;
        const userId = msg.user?.username || msg.user?.id || userName; // unique key

        if (userName && userId) {
          userMap.set(userId, userName);
        }
      });

      const userList = Array.from(userMap.entries())
        .map(([id, name]) => ({
          id,
          name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setUsers(userList);
      setAllUsers(userList);
      console.log('✅ Users:', userList.length);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  };

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };

    // If group changes, filter users
    if (key === 'group') {
      if (value) {
        // ✅ Filter users by group (client-side for now)
        axios
          .get(`http://localhost:8000/api/messages/?page_size=1000`)
          .then((res) => {
            const msgs = res.data.results || res.data;

            // Filter messages by group
            const filteredMsgs = msgs.filter((m) => {
              const groupName = m.group?.title || m.group?.name || m.group_name;
              return groupName === value;
            });

            // Get unique users from filtered messages
            const userMap = new Map();
            filteredMsgs.forEach((m) => {
              const userName =
                m.user?.full_name ||
                m.user?.first_name ||
                m.user?.username ||
                m.user_name;
              const userId = m.user?.username || m.user?.id || userName;

              if (userName && userId) {
                userMap.set(userId, userName);
              }
            });

            const filtered = Array.from(userMap.entries())
              .map(([id, name]) => ({
                id,
                name,
              }))
              .sort((a, b) => a.name.localeCompare(b.name));

            setUsers(filtered);
            console.log('👥 Users in group:', filtered.length);
          })
          .catch((err) => console.error(err));
      } else {
        setUsers(allUsers);
      }

      // Reset user
      newFilters.user = '';
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
    console.log('🔍 Filters:', newFilters);
  };

  const reset = () => {
    const empty = {
      user: '',
      group: '',
      dateFrom: '',
      dateTo: '',
      topic: '',
      sentiment: '',
    };
    setFilters(empty);
    setUsers(allUsers);
    onFilterChange(empty);
  };

  const activeCount = Object.values(filters).filter((v) => v !== '').length;

  return (
    <div
      className={`mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            darkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4 inline mr-2" />
          Filtrlash
          {activeCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            onClick={reset}
            className={`px-4 py-2 rounded-lg transition ${
              darkMode
                ? 'text-red-400 hover:bg-gray-700'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <X className="w-4 h-4 inline mr-1" />
            Tozalash
          </button>
        )}
      </div>

      {/* Filters */}
      {isOpen && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Group */}
          <div>
            <label
              className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <Hash className="w-4 h-4 inline" /> Guruh
            </label>
            <select
              value={filters.group}
              onChange={(e) => handleChange('group', e.target.value)}
              className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
            >
              <option value="">Barchasi ({groups.length})</option>
              {groups.map((g, i) => (
                <option key={i} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* User */}
          <div>
            <label
              className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <User className="w-4 h-4 inline" /> Foydalanuvchi
            </label>
            <select
              value={filters.user}
              onChange={(e) => handleChange('user', e.target.value)}
              className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
            >
              <option value="">Barchasi ({users.length})</option>
              {users.map((u, i) => (
                <option key={i} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment */}
          <div>
            <label
              className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <SmilePlus className="w-4 h-4 inline" /> Sentiment
            </label>
            <select
              value={filters.sentiment}
              onChange={(e) => handleChange('sentiment', e.target.value)}
              className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
            >
              <option value="">Barchasi</option>
              <option value="positive">😊 Positive</option>
              <option value="neutral">😐 Neutral</option>
              <option value="negative">😞 Negative</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label
              className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <Calendar className="w-4 h-4 inline" /> Dan
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
            />
          </div>

          {/* Date To */}
          <div>
            <label
              className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <Calendar className="w-4 h-4 inline" /> Gacha
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
            />
          </div>

          {/* Search */}
          <div>
            <label
              className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <Search className="w-4 h-4 inline" /> Qidiruv
            </label>
            <input
              type="text"
              value={filters.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              placeholder="Kalit so'z..."
              className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
            />
          </div>
        </div>
      )}

      {/* Active filters badges */}
      {activeCount > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.group && (
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                darkMode
                  ? 'bg-green-900 text-green-200'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              Guruh: {filters.group}
              <X
                className="w-3 h-3 inline ml-2 cursor-pointer hover:opacity-70"
                onClick={() => handleChange('group', '')}
              />
            </span>
          )}
          {filters.user && (
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                darkMode
                  ? 'bg-blue-900 text-blue-200'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              User: {filters.user}
              <X
                className="w-3 h-3 inline ml-2 cursor-pointer hover:opacity-70"
                onClick={() => handleChange('user', '')}
              />
            </span>
          )}
          {filters.sentiment && (
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                darkMode
                  ? 'bg-purple-900 text-purple-200'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              Sentiment: {filters.sentiment}
              <X
                className="w-3 h-3 inline ml-2 cursor-pointer hover:opacity-70"
                onClick={() => handleChange('sentiment', '')}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default Filters;
