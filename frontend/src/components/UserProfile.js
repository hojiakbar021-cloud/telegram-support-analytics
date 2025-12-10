import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  TrendingUp,
  Heart,
  Clock,
  Image,
  Video,
  Mic,
  FileText,
  MapPin,
  Smile,
  FileIcon,
} from 'lucide-react';
import axios from 'axios';

function UserProfile({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading profile for user:', user);

      const response = await axios.get(
        `http://localhost:8000/api/stats/user/${user.telegram_id || user.id}/`
      );

      console.log('Profile data:', response.data);
      setProfile(response.data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError("Foydalanuvchi ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Get media icon
  const getMediaIcon = (type) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'photo':
        return <Image className={iconClass} />;
      case 'video':
        return <Video className={iconClass} />;
      case 'voice':
      case 'audio':
        return <Mic className={iconClass} />;
      case 'document':
        return <FileText className={iconClass} />;
      case 'location':
        return <MapPin className={iconClass} />;
      case 'emoji':
        return <Smile className={iconClass} />;
      case 'sticker':
        return <Smile className={iconClass} />;
      default:
        return <FileIcon className={iconClass} />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">Foydalanuvchi Profili</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
              {(user.full_name ||
                user.first_name ||
                user.username ||
                'U')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {user.full_name ||
                  user.first_name ||
                  user.username ||
                  'Unknown User'}
              </h3>
              <p className="text-blue-100">@{user.username || 'no_username'}</p>
              <p className="text-sm text-blue-100">
                User ID: {user.telegram_id || user.id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={loadUserProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Qayta urinish
              </button>
            </div>
          )}

          {!loading && !error && profile && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.total_messages}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Xabarlar
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(profile.total_messages / 30)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Kunlik O'rtacha
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.sentiment_distribution &&
                    profile.sentiment_distribution.length > 0
                      ? profile.sentiment_distribution[0].sentiment
                      : '0%'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sentiment
                  </p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.questions_asked || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Savollar
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileIcon className="w-5 h-5 mr-2" />
                  Media Turlari
                </h3>
                <div className="space-y-3">
                  {profile.media_distribution &&
                  profile.media_distribution.length > 0 ? (
                    profile.media_distribution.map((media, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            {getMediaIcon(media.media_type)}
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 capitalize">
                            {media.media_type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(media.count / profile.total_messages) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-gray-900 dark:text-white font-semibold w-12 text-right">
                            {media.count}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      Media ma'lumotlari yo'q
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Matn xabarlari
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.text_messages || 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Media xabarlari
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.media_messages || 0}
                  </p>
                </div>
              </div>

              {profile.sentiment_distribution &&
                profile.sentiment_distribution.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Sentiment Taqsimoti
                    </h3>
                    <div className="space-y-3">
                      {profile.sentiment_distribution.map((sent, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(sent.sentiment)}`}
                          >
                            {sent.sentiment}
                          </span>
                          <div className="flex items-center space-x-4 flex-1 ml-4">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  sent.sentiment === 'positive'
                                    ? 'bg-green-500'
                                    : sent.sentiment === 'negative'
                                      ? 'bg-red-500'
                                      : 'bg-gray-500'
                                }`}
                                style={{
                                  width: `${(sent.count / profile.total_messages) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-gray-900 dark:text-white font-semibold w-12 text-right">
                              {sent.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
