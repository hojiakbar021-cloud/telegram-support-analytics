import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Image,
  Video,
  Mic,
  FileText,
  Film,
  Sticker,
  MapPin,
  User,
  BarChart2,
  Eye,
  Smile,
  Filter,
  X,
} from 'lucide-react';
import MessageEditHistory from './MessageEditHistory';
import MediaViewer from './MediaViewer';
import axios from 'axios';

// Media type icons
const getMediaIcon = (mediaType) => {
  const icons = {
    emoji: <Smile className="w-4 h-4" />,
    photo: <Image className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
    voice: <Mic className="w-4 h-4" />,
    audio: <Mic className="w-4 h-4" />,
    document: <FileText className="w-4 h-4" />,
    animation: <Film className="w-4 h-4" />,
    sticker: <Sticker className="w-4 h-4" />,
    video_note: <Video className="w-4 h-4" />,
    location: <MapPin className="w-4 h-4" />,
    contact: <User className="w-4 h-4" />,
    poll: <BarChart2 className="w-4 h-4" />,
  };
  return icons[mediaType] || null;
};

// Media type labels
const getMediaLabel = (mediaType) => {
  const labels = {
    emoji: 'Emoji',
    photo: 'Rasm',
    video: 'Video',
    voice: 'Ovozli xabar',
    audio: 'Audio',
    document: 'Hujjat',
    animation: 'GIF',
    sticker: 'Stiker',
    video_note: 'Video xabar',
    location: 'Joylashuv',
    contact: 'Kontakt',
    poll: "So'rovnoma",
    text: 'Matn',
  };
  return labels[mediaType] || mediaType;
};

function RecentMessages() {
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [searchText, setSearchText] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Media viewer
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Fetch groups on mount
  useEffect(() => {
    axios
      .get('http://localhost:8000/api/messages/')
      .then((response) => {
        const messagesData = response.data.results || response.data;

        // Extract unique groups
        const uniqueGroups = {};
        messagesData.forEach((msg) => {
          if (msg.group && msg.group.telegram_id) {
            uniqueGroups[msg.group.telegram_id] = msg.group;
          }
        });

        setGroups(Object.values(uniqueGroups));
      })
      .catch((error) => {
        console.error('Error fetching groups:', error);
      });
  }, []);

  // Fetch users based on selected group
  useEffect(() => {
    if (selectedGroup) {
      // Get users from selected group only
      axios
        .get(`http://localhost:8000/api/messages/?group_id=${selectedGroup}`)
        .then((response) => {
          const messagesData = response.data.results || response.data;

          // Extract unique users from this group
          const uniqueUsers = {};
          messagesData.forEach((msg) => {
            if (msg.user && msg.user.telegram_id) {
              uniqueUsers[msg.user.telegram_id] = msg.user;
            }
          });

          setUsers(Object.values(uniqueUsers));
        })
        .catch((error) => {
          console.error('Error fetching users:', error);
        });
    } else {
      // Get all users
      axios
        .get('http://localhost:8000/api/stats/top-users/?limit=100')
        .then((response) => {
          setUsers(response.data);
        })
        .catch((error) => {
          console.error('Error fetching all users:', error);
        });
    }
  }, [selectedGroup]);

  // Fetch messages with filters
  const fetchMessages = async () => {
    try {
      setLoading(true);

      // Build filter parameters
      const params = {};

      if (selectedGroup) {
        params.group_id = selectedGroup;
      }

      if (selectedUser) {
        params.user_id = selectedUser; // TELEGRAM_ID (raqam)
      }

      if (searchText && searchText.trim() !== '') {
        params.search = searchText.trim();
      }

      console.log('API Request params:', params);

      // API request
      const response = await axios.get('http://localhost:8000/api/messages/', {
        params: params,
      });

      const data = response.data;
      setMessages(data.results || data);

      // Handle pagination if exists
      if (data.count && data.results) {
        setTotalPages(Math.ceil(data.count / 20));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when filters change
  useEffect(() => {
    fetchMessages();
  }, [selectedGroup, selectedUser, searchText, currentPage]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedGroup('');
    setSelectedUser('');
    setSearchText('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = selectedGroup || selectedUser || searchText;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white">
          <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
          So'nggi Xabarlar
          {messages.length > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              ({messages.length})
            </span>
          )}
        </h3>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <X className="w-4 h-4 mr-1" />
            Filtrni tozalash
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4 inline mr-1" />
            Guruh
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedUser('');
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Barcha guruhlar</option>
            {groups.map((group) => (
              <option key={group.telegram_id} value={group.telegram_id}>
                {group.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4 inline mr-1" />
            Foydalanuvchi
          </label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {selectedGroup
                ? 'Bu guruhdagi barcha userlar'
                : 'Barcha foydalanuvchilar'}
            </option>
            {users.map((user) => (
              <option
                key={user.telegram_id || user.user_id}
                value={user.telegram_id || user.user_id}
              >
                {user.full_name || user.username || 'Unknown'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Qidiruv
          </label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Xabar matni bo'yicha..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Yuklanmoqda...
          </p>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Hech narsa topilmadi
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchText && `"${searchText}" kalit so'zi bo'yicha natija yo'q`}
            {selectedGroup &&
              !searchText &&
              selectedUser &&
              "Bu guruh va foydalanuvchi bo'yicha xabar topilmadi"}
            {selectedGroup &&
              !searchText &&
              !selectedUser &&
              'Bu guruhda xabar topilmadi'}
            {!selectedGroup &&
              !searchText &&
              selectedUser &&
              'Bu foydalanuvchi xabari topilmadi'}
            {!hasActiveFilters && 'Hech qanday xabar topilmadi'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Filtrni tozalash
            </button>
          )}
        </div>
      )}

      {!loading && messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={`${message.id}-${index}`}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                    <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">
                      {message.user_name
                        ? message.user_name.charAt(0).toUpperCase()
                        : '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {message.user_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(message.telegram_created_at).toLocaleString(
                        'uz-UZ'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${
                      message.media_type === 'text'
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        : message.media_type === 'emoji'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          : message.media_type === 'photo'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : message.media_type === 'video'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                              : message.media_type === 'voice'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}
                  >
                    {getMediaIcon(message.media_type)}
                    {getMediaLabel(message.media_type)}
                  </span>
                  {message.is_edited && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      Tahrirlangan
                    </span>
                  )}
                  {message.is_deleted && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                      O'chirilgan
                    </span>
                  )}
                </div>
              </div>

              {message.text ? (
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                  {message.text.length > 200
                    ? `${message.text.substring(0, 200)}...`
                    : message.text}
                </p>
              ) : (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <span className="mr-2">
                        {getMediaIcon(message.media_type)}
                      </span>
                      <span className="text-sm">
                        {message.media_type === 'photo' && "📷 Rasm jo'natildi"}
                        {message.media_type === 'video' &&
                          "🎥 Video jo'natildi"}
                        {message.media_type === 'voice' &&
                          "🎤 Ovozli xabar jo'natildi"}
                        {message.media_type === 'audio' &&
                          "🎵 Audio jo'natildi"}
                        {message.media_type === 'document' &&
                          "📎 Hujjat jo'natildi"}
                        {message.media_type === 'animation' &&
                          "🎬 GIF jo'natildi"}
                        {message.media_type === 'sticker' &&
                          "😀 Stiker jo'natildi"}
                      </span>
                    </div>
                    {message.media_type !== 'text' && (
                      <button
                        onClick={() => setSelectedMedia(message)}
                        className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ko'rish
                      </button>
                    )}
                  </div>
                </div>
              )}

              <MessageEditHistory
                messageId={message.message_id}
                isEdited={message.is_edited}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && messages.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-6">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center px-4 py-2 rounded-lg transition ${
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Oldingi
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Sahifa {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center px-4 py-2 rounded-lg transition ${
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Keyingi
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {selectedMedia && (
        <MediaViewer
          message={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
}

export default RecentMessages;
