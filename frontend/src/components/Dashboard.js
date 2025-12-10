import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Trash2,
  Edit,
} from 'lucide-react';

// Components
import StatCard from './StatCard';
import ReplyChainStats from './ReplyChainStats';
import ActivityChart from './ActivityChart';
import GeminiInsights from './GeminiInsights';
import UserProfile from './UserProfile';
import GroupComparison from './GroupComparison';
import MessageEditHistory from './MessageEditHistory';
import MediaViewer from './MediaViewer';
import Filters from './Filters';
import DarkModeToggle from './DarkModeToggle';
import ExportButton from './ExportButton';
import LoadingAnimation from './LoadingAnimation';

function Dashboard() {
  // ✅ Dark mode with localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  const [overview, setOverview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [wordFrequency, setWordFrequency] = useState([]);
  const [mediaDistribution, setMediaDistribution] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [messagesPerDay, setMessagesPerDay] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null); // ✅ Only one user modal
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const messagesPerPage = 7;

  // Filters state
  const [filters, setFilters] = useState({
    user: '',
    group: '',
    dateFrom: '',
    dateTo: '',
    topic: '',
    sentiment: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        overviewRes,
        messagesRes,
        topUsersRes,
        wordFreqRes,
        mediaRes,
        sentimentRes,
        messagesPerDayRes,
        allMessagesRes,
      ] = await Promise.all([
        axios.get('http://localhost:8000/api/stats/overview/'),
        axios.get('http://localhost:8000/api/messages/?page_size=100'),
        axios.get('http://localhost:8000/api/stats/top-users/?limit=10'),
        axios.get('http://localhost:8000/api/stats/word-frequency/?limit=15'),
        axios.get('http://localhost:8000/api/stats/media-distribution/'),
        axios.get('http://localhost:8000/api/stats/sentiment-overall/'),
        axios.get('http://localhost:8000/api/stats/messages-per-day/?days=7'),
        axios.get('http://localhost:8000/api/messages/?page_size=1000'),
      ]);

      setOverview(overviewRes.data);

      const messagesData = messagesRes.data.results || messagesRes.data;
      const allMessagesArray = Array.isArray(messagesData) ? messagesData : [];
      setMessages(allMessagesArray);
      setTotalPages(Math.ceil(allMessagesArray.length / messagesPerPage));

      setTopUsers(topUsersRes.data || []);
      setWordFrequency(wordFreqRes.data || []);
      setMediaDistribution(mediaRes.data || []);
      setSentiment(sentimentRes.data);
      setMessagesPerDay(messagesPerDayRes.data || []);

      const allMessagesData =
        allMessagesRes.data.results || allMessagesRes.data;
      setAllMessages(Array.isArray(allMessagesData) ? allMessagesData : []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadDataWithFilters(newFilters);
  };

  const loadDataWithFilters = async (currentFilters) => {
    try {
      setLoading(true);

      const messagesRes = await axios.get(
        'http://localhost:8000/api/messages/?page_size=1000'
      );

      const messagesData = messagesRes.data.results || messagesRes.data;
      let allMessagesArray = Array.isArray(messagesData) ? messagesData : [];

      console.log('📊 Total messages:', allMessagesArray.length);

      let filteredMessages = allMessagesArray;

      if (currentFilters.group) {
        filteredMessages = filteredMessages.filter((msg) => {
          const groupName = msg.group?.title || msg.group?.name || '';
          return groupName === currentFilters.group;
        });
        console.log('🔍 After group filter:', filteredMessages.length);
      }

      if (currentFilters.user) {
        filteredMessages = filteredMessages.filter((msg) => {
          const userName =
            msg.user?.full_name ||
            msg.user?.first_name ||
            msg.user?.username ||
            '';
          return userName === currentFilters.user;
        });
        console.log('🔍 After user filter:', filteredMessages.length);
      }

      if (currentFilters.sentiment) {
        filteredMessages = filteredMessages.filter(
          (msg) => msg.sentiment === currentFilters.sentiment
        );
        console.log('🔍 After sentiment filter:', filteredMessages.length);
      }

      if (currentFilters.topic) {
        const searchTerm = currentFilters.topic.toLowerCase();
        filteredMessages = filteredMessages.filter((msg) =>
          msg.text?.toLowerCase().includes(searchTerm)
        );
        console.log('🔍 After search filter:', filteredMessages.length);
      }

      if (currentFilters.dateFrom) {
        const fromDate = new Date(currentFilters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filteredMessages = filteredMessages.filter((msg) => {
          const msgDate = new Date(msg.telegram_created_at);
          return msgDate >= fromDate;
        });
        console.log('🔍 After date from:', filteredMessages.length);
      }

      if (currentFilters.dateTo) {
        const toDate = new Date(currentFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredMessages = filteredMessages.filter((msg) => {
          const msgDate = new Date(msg.telegram_created_at);
          return msgDate <= toDate;
        });
        console.log('🔍 After date to:', filteredMessages.length);
      }

      console.log('✅ Final filtered:', filteredMessages.length);

      setMessages(filteredMessages);
      setCurrentPage(1);
      setTotalPages(Math.ceil(filteredMessages.length / messagesPerPage));
    } catch (error) {
      console.error('❌ Error loading filtered data:', error);
      setMessages([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getPaginatedMessages = () => {
    const startIndex = (currentPage - 1) * messagesPerPage;
    const endIndex = startIndex + messagesPerPage;
    return messages.slice(startIndex, endIndex);
  };

  const handleDownloadMedia = async (message) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/messages/${message.message_id}/file/`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        message.media_file_name || `file_${message.message_id}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Fayl yuklab olinmadi. Xatolik yuz berdi.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSentimentIcon = (sentiment) => {
    const icons = {
      positive: '😊',
      negative: '😞',
      neutral: '😐',
    };
    return icons[sentiment] || icons.neutral;
  };

  if (loading && !overview) {
    return <LoadingAnimation />;
  }

  const paginatedMessages = getPaginatedMessages();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1
              className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              📊 HR Support Analytics
            </h1>
            <p
              className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Telegram Bot Analytics Dashboard
            </p>
          </div>

          <ExportButton
            data={messages}
            filename="telegram_messages"
            darkMode={darkMode}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Jami Xabarlar"
            value={overview?.total_messages || 0}
            icon={<MessageSquare className="w-8 h-8" />}
            color="blue"
            darkMode={darkMode}
          />
          <StatCard
            title="Foydalanuvchilar"
            value={overview?.total_users || 0}
            icon={<Users className="w-8 h-8" />}
            color="green"
            darkMode={darkMode}
          />
          <StatCard
            title="Guruhlar"
            value={overview?.total_groups || 0}
            icon={<TrendingUp className="w-8 h-8" />}
            color="purple"
            darkMode={darkMode}
          />
          <StatCard
            title="O'chirilgan"
            value={overview?.deleted_messages || 0}
            icon={<Trash2 className="w-8 h-8" />}
            color="red"
            darkMode={darkMode}
          />
          <StatCard
            title="Tahrirlangan"
            value={overview?.edited_messages || 0}
            icon={<Edit className="w-8 h-8" />}
            color="yellow"
            darkMode={darkMode}
          />
          <StatCard
            title="Faol Suhbatlar"
            value={overview?.total_groups || 0}
            icon={<Activity className="w-8 h-8" />}
            color="orange"
            darkMode={darkMode}
          />
        </div>

        <Filters darkMode={darkMode} onFilterChange={handleFilterChange} />

        <div
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow mb-8 overflow-hidden`}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3
              className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Oxirgi Xabarlar
            </h3>
            <span
              className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Sahifa {currentPage} / {totalPages}
            </span>
          </div>

          <div className="p-6 space-y-4">
            {paginatedMessages && paginatedMessages.length > 0 ? (
              paginatedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`${darkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'} 
                  p-4 rounded-lg transition-all duration-200 border 
                  ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() =>
                          message.user && setSelectedUser(message.user)
                        }
                        disabled={!message.user}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          darkMode
                            ? 'bg-blue-900 text-blue-200 hover:bg-blue-800'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        } font-semibold transition ${message.user ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                      >
                        {message.user
                          ? (message.user.full_name ||
                              message.user.first_name ||
                              message.user.username ||
                              'U')[0].toUpperCase()
                          : 'U'}
                      </button>

                      <div>
                        {message.user ? (
                          <button
                            onClick={() => setSelectedUser(message.user)}
                            className={`font-semibold ${darkMode ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'} transition cursor-pointer text-left`}
                          >
                            {message.user.full_name ||
                              message.user.first_name ||
                              message.user.username ||
                              'Unknown User'}
                          </button>
                        ) : (
                          <span
                            className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            Unknown User
                          </span>
                        )}
                        <div className="flex items-center space-x-2 text-xs">
                          <span
                            className={
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }
                          >
                            {formatDate(message.telegram_created_at)}
                          </span>
                          {(message.group?.title || message.group?.name) && (
                            <>
                              <span
                                className={
                                  darkMode ? 'text-gray-600' : 'text-gray-300'
                                }
                              >
                                •
                              </span>
                              <span
                                className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} font-medium`}
                              >
                                {message.group?.title || message.group?.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      {message.media_type && message.media_type !== 'text' && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            message.media_type === 'photo'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                              : message.media_type === 'video'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                                : message.media_type === 'voice'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                  : message.media_type === 'document'
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200'
                          }`}
                        >
                          {message.media_type === 'photo' && '📷'}
                          {message.media_type === 'video' && '🎥'}
                          {message.media_type === 'voice' && '🎤'}
                          {message.media_type === 'document' && '📄'}{' '}
                          {message.media_type}
                        </span>
                      )}

                      {message.is_edited && (
                        <span className="px-2 py-1 text-xs rounded-full font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                          ✏️ Tahrirlangan
                        </span>
                      )}

                      {message.is_deleted && (
                        <span className="px-2 py-1 text-xs rounded-full font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                          🗑️ O'chirilgan
                        </span>
                      )}

                      {message.reply_to_message_id && (
                        <span className="px-2 py-1 text-xs rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          ↩️ Javob
                        </span>
                      )}

                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          message.sentiment === 'positive'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                            : message.sentiment === 'negative'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200'
                        }`}
                      >
                        {getSentimentIcon(message.sentiment)}{' '}
                        {message.sentiment || 'neutral'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    {message.text ? (
                      <p
                        className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap`}
                      >
                        {message.text}
                      </p>
                    ) : (
                      <p
                        className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}
                      >
                        [Media xabari - matn yo'q]
                      </p>
                    )}
                  </div>

                  {message.media_type && message.media_type !== 'text' && (
                    <div className="mt-3">
                      <div
                        className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg flex items-center justify-between`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {message.media_type === 'photo' && '🖼️'}
                            {message.media_type === 'video' && '🎬'}
                            {message.media_type === 'voice' && '🎙️'}
                            {message.media_type === 'document' && '📎'}
                          </span>
                          <div>
                            <p
                              className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                              {message.media_type === 'photo' && 'Rasm'}
                              {message.media_type === 'video' && 'Video'}
                              {message.media_type === 'voice' && 'Ovozli xabar'}
                              {message.media_type === 'document' &&
                                (message.media_file_name || 'Hujjat')}
                            </p>
                            {message.media_file_size && (
                              <p
                                className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
                              >
                                {message.media_type === 'video' ||
                                message.media_type === 'document'
                                  ? `${(message.media_file_size / (1024 * 1024)).toFixed(2)} MB`
                                  : `${(message.media_file_size / 1024).toFixed(2)} KB`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedMessage(message)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                          >
                            {message.media_type === 'voice'
                              ? '▶️ Eshitish'
                              : "👁️ Ko'rish"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.is_edited && (
                    <div className="mt-3">
                      <MessageEditHistory
                        messageId={message.message_id}
                        isEdited={message.is_edited}
                      />
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <span
                        className={darkMode ? 'text-gray-400' : 'text-gray-500'}
                      >
                        ID: {message.message_id}
                      </span>
                      {message.forward_from && (
                        <span
                          className={`${darkMode ? 'text-purple-400' : 'text-purple-600'} flex items-center space-x-1`}
                        >
                          <span>↗️</span>
                          <span>Forward</span>
                        </span>
                      )}
                    </div>

                    {message.telegram_edited_at && (
                      <span
                        className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
                      >
                        ✏️ {formatDate(message.telegram_edited_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p
                  className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Xabarlar topilmadi
                </p>
                {(filters.user || filters.group || filters.topic) && (
                  <p
                    className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}
                  >
                    Filter parametrlarini o'zgartiring yoki tozalang
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}
          >
            <div
              className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
            >
              {paginatedMessages.length} xabar (Jami: {messages.length})
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                } ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                <ChevronLeft className="w-4 h-4" />
                Oldingi
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Keyingi
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <ReplyChainStats darkMode={darkMode} />
        <ActivityChart darkMode={darkMode} />
        <GeminiInsights darkMode={darkMode} />
        <GroupComparison darkMode={darkMode} />

        <div className="mb-8">
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}
          >
            <h3
              className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Top Faol Foydalanuvchilar
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}
                    >
                      Rank
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}
                    >
                      Foydalanuvchi
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}
                    >
                      Xabarlar
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}
                    >
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
                >
                  {topUsers && topUsers.length > 0 ? (
                    topUsers.map((user, index) => (
                      <tr
                        key={user.user_id}
                        className={
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }
                      >
                        <td
                          className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
                        >
                          {index === 0
                            ? '🥇'
                            : index === 1
                              ? '🥈'
                              : index === 2
                                ? '🥉'
                                : index + 1}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
                        >
                          {user.username || user.first_name || 'Unknown'}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                        >
                          {user.message_count}
                        </td>
                        <td className={`px-4 py-3 text-sm`}>
                          <button
                            onClick={() =>
                              setSelectedUser({
                                telegram_id: user.user_id,
                                username: user.username,
                                first_name: user.first_name,
                                full_name: user.username || user.first_name,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            Ko'rish →
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Foydalanuvchilar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}
          >
            <h3
              className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Eng Ko'p Ishlatiladigan So'zlar
            </h3>
            <div className="space-y-2">
              {wordFrequency && wordFrequency.length > 0 ? (
                wordFrequency.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
                      >
                        {index + 1}. {item.word}
                      </span>
                      {item.group && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            darkMode
                              ? 'bg-blue-900 text-blue-200'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.group}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Ma'lumot topilmadi
                </p>
              )}
            </div>
          </div>

          <div
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}
          >
            <h3
              className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              <PieChart className="w-5 h-5 mr-2 text-purple-600" />
              Media Statistika
            </h3>
            <div className="space-y-3">
              {mediaDistribution && mediaDistribution.length > 0 ? (
                mediaDistribution.map((item, index) => {
                  const total = mediaDistribution.reduce(
                    (sum, d) => sum + d.count,
                    0
                  );
                  const percentage = total > 0 ? (item.count / total) * 100 : 0;

                  return (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span
                          className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {item.media_type || 'Text'}
                        </span>
                        <span
                          className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {item.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div
                        className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                      >
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Ma'lumot topilmadi
                </p>
              )}
            </div>
          </div>
        </div>

        {selectedUser && selectedUser.telegram_id && (
          <UserProfile
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}

        {selectedMessage && (
          <MediaViewer
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
          />
        )}
      </main>

      <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
    </div>
  );
}

export default Dashboard;
