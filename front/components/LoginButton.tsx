import React, { useEffect, useState } from 'react';
import API, { TokenManager } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  credits: number;
}

interface LoginButtonProps {
  onLogout?: () => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查是否已登录
    const checkAuth = async () => {
      const token = TokenManager.getAccessToken();
      if (token) {
        try {
          const userData = await API.auth.getCurrentUser();
          setUser(userData);
          const userCredits = await API.user.getCredits();
          setCredits(userCredits);
        } catch (error) {
          console.error('Auth check failed:', error);
          TokenManager.clearTokens();
        }
      }
      setLoading(false);
    };

    checkAuth();

    // 监听 OAuth 回调
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin === 'http://localhost:5173') {
        const { accessToken, refreshToken } = event.data;
        if (accessToken && refreshToken) {
          TokenManager.setTokens(accessToken, refreshToken);

          // 获取用户信息
          try {
            const userData = await API.auth.getCurrentUser();
            setUser(userData);
            const userCredits = await API.user.getCredits();
            setCredits(userCredits);
          } catch (error) {
            console.error('Failed to get user info:', error);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = () => {
    API.auth.loginWithGoogle();
  };

  const handleLogout = async () => {
    await API.auth.logout();
    setUser(null);
    setCredits(0);
    if (onLogout) {
      onLogout();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        {/* 点数显示 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-white">{credits}</span>
        </div>

        {/* 用户信息 */}
        <div className="flex items-center gap-3">
          {user.avatar && (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
          )}
          <div className="text-sm">
            <div className="font-medium text-white">{user.name}</div>
            <div className="text-xs text-gray-300">{user.email}</div>
          </div>
        </div>

        {/* 登出按钮 */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-100 text-gray-800 rounded-lg transition-colors shadow-md"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span className="font-medium">使用 Google 登录</span>
    </button>
  );
};
