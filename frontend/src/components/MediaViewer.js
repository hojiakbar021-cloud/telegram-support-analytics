import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  AlertCircle,
  MapPin,
  Music,
  FileText,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import axios from 'axios';

function MediaViewer({ message, onClose }) {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMedia();
  }, [message]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        'Loading media for message:',
        message.message_id,
        'type:',
        message.media_type
      );

      // ✅ Handle special media types that don't have files
      if (message.media_type === 'location') {
        setLoading(false);
        return;
      }

      if (message.media_type === 'contact') {
        setLoading(false);
        return;
      }

      if (message.media_type === 'poll') {
        setLoading(false);
        return;
      }

      if (message.media_type === 'text') {
        setError("Bu xabarda media yo'q");
        setLoading(false);
        return;
      }

      // ✅ Try to load actual media files via proxy
      const proxyUrl = `http://localhost:8000/api/messages/${message.message_id}/proxy/`;
      console.log('Fetching via proxy:', proxyUrl);

      const response = await axios.get(proxyUrl, {
        responseType: 'blob',
        timeout: 30000,
      });

      const url = URL.createObjectURL(response.data);
      setMediaUrl(url);
      console.log('✅ Media loaded successfully');
    } catch (err) {
      console.error('Error loading media:', err);

      if (err.response?.status === 404) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          setError(errorData.error || errorData.note || 'Media topilmadi');
        } catch {
          setError('Media fayl topilmadi');
        }
      } else if (err.code === 'ECONNABORTED') {
        setError('Vaqt tugadi. Fayl juda katta yoki internet sekin.');
      } else if (err.response?.data) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          setError(errorData.error || 'Xatolik yuz berdi');
        } catch {
          setError("Faylni yuklab bo'lmadi");
        }
      } else {
        setError("Faylni yuklab bo'lmadi. Qayta urinib ko'ring.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!mediaUrl) return;

    try {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download =
        message.media_file_name ||
        `${message.media_type}_${message.message_id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert('Yuklab olishda xatolik');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  const getMediaIcon = () => {
    switch (message.media_type) {
      case 'photo':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
      case 'animation':
        return <Film className="w-5 h-5" />;
      case 'voice':
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'location':
        return <MapPin className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-semibold text-blue-600 dark:text-blue-200">
              {(message.user?.full_name ||
                message.user?.first_name ||
                message.user?.username ||
                'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {message.user?.full_name ||
                  message.user?.first_name ||
                  message.user?.username ||
                  'Unknown User'}
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                {getMediaIcon()}
                <span>{message.media_type || 'Media'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {mediaUrl && (
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title="Yuklab olish"
              >
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Yopish"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Telegram'dan yuklab olinmoqda...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center max-w-md">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
                Xatolik
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {error}
              </p>
              <button
                onClick={loadMedia}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Qayta urinish
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {message.media_type === 'photo' && mediaUrl && (
                <img
                  src={mediaUrl}
                  alt="Photo"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={() => setError("Rasmni yuklab bo'lmadi")}
                />
              )}

              {(message.media_type === 'video' ||
                message.media_type === 'animation') &&
                mediaUrl && (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay={message.media_type === 'animation'}
                    loop={message.media_type === 'animation'}
                    className="max-w-full max-h-full rounded-lg shadow-lg"
                    onError={() => setError("Videoni yuklab bo'lmadi")}
                  >
                    Brauzeringiz video ni qo'llab-quvvatlamaydi.
                  </video>
                )}

              {(message.media_type === 'voice' ||
                message.media_type === 'audio') &&
                mediaUrl && (
                  <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-2xl">
                            {message.media_type === 'voice' ? '🎤' : '🎵'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {message.media_type === 'voice'
                              ? 'Ovozli xabar'
                              : 'Audio fayl'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {message.media_file_size
                              ? `${(message.media_file_size / 1024).toFixed(2)} KB`
                              : 'Audio'}
                          </p>
                        </div>
                      </div>
                      <audio
                        src={mediaUrl}
                        controls
                        className="w-full"
                        onError={() => setError("Audioni yuklab bo'lmadi")}
                      >
                        Brauzeringiz audio ni qo'llab-quvvatlamaydi.
                      </audio>
                    </div>
                  </div>
                )}

              {message.media_type === 'document' && (
                <div className="w-full max-w-md">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-orange-600 dark:text-orange-300" />
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">
                      {message.media_file_name || 'Hujjat'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {message.media_file_size
                        ? `${(message.media_file_size / (1024 * 1024)).toFixed(2)} MB`
                        : 'Fayl'}
                    </p>
                    {mediaUrl ? (
                      <button
                        onClick={handleDownload}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 mx-auto"
                      >
                        <Download className="w-4 h-4" />
                        <span>Yuklab olish</span>
                      </button>
                    ) : (
                      <button
                        onClick={loadMedia}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mx-auto"
                      >
                        Yuklab olish
                      </button>
                    )}
                  </div>
                </div>
              )}

              {message.media_type === 'sticker' && (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-6xl">🎭</span>
                  </div>
                  <p className="text-gray-900 dark:text-white mb-2 font-semibold text-lg">
                    Sticker
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sticker'lar yuklab olinmaydi
                  </p>
                </div>
              )}

              {message.media_type === 'location' && (
                <div className="w-full max-w-md">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-10 h-10 text-green-600 dark:text-green-300" />
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">
                      Joylashuv
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Telegram joylashuv xabari
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        📍 Koordinatalar Telegram'da ko'riladi
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {message.media_type === 'contact' && (
                <div className="w-full max-w-md">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">👤</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">
                      Kontakt
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Telegram kontakt xabari
                    </p>
                  </div>
                </div>
              )}

              {message.media_type === 'poll' && (
                <div className="w-full max-w-md">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
                    <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">📊</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">
                      So'rovnoma
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Telegram so'rovnomasi
                    </p>
                  </div>
                </div>
              )}

              {message.media_type === 'video_note' && mediaUrl && (
                <div className="flex flex-col items-center">
                  <div className="w-64 h-64 rounded-full overflow-hidden shadow-xl">
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full h-full object-cover"
                      onError={() => setError("Video noteni yuklab bo'lmadi")}
                    >
                      Brauzeringiz video ni qo'llab-quvvatlamaydi.
                    </video>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    🎥 Dumaloq video xabar
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {message.text && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {message.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaViewer;
