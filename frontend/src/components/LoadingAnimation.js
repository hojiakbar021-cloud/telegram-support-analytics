import React from 'react';
import { BarChart3, MessageSquare, Users, TrendingUp } from 'lucide-react';

function LoadingAnimation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>

          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '3s' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '3s', animationDelay: '1s' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '3s', animationDelay: '2s' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          HR Support Analytics
        </h1>

        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <span className="text-lg">Ma'lumotlar yuklanmoqda</span>
          <div className="flex space-x-1">
            <span
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: '0s' }}
            ></span>
            <span
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></span>
            <span
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: '0.4s' }}
            ></span>
          </div>
        </div>

        <div className="w-64 mx-auto mt-6 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-progress"></div>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Telegram guruh statistikasi tayyorlanmoqda...
        </p>
      </div>
    </div>
  );
}

export default LoadingAnimation;
