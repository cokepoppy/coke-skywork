import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(true);

  useEffect(() => {
    // Check for error in URL params
    const errorParam = searchParams.get('error');
    const debugParam = searchParams.get('debug');

    if (errorParam === 'google_disabled') {
      setGoogleEnabled(false);
    } else if (errorParam === 'google_login_failed') {
      setError(`Google 登录失败，请稍后再试${debugParam ? `（${decodeURIComponent(debugParam)}）` : ''}`);
    } else if (errorParam) {
      setError('登录失败，请稍后再试。');
    }

    // Check if Google OAuth is configured
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/config`)
      .then(res => res.json())
      .then(data => {
        const backendEnabled = data?.data?.googleEnabled ?? true;
        const isTrusted = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        setGoogleEnabled(backendEnabled && isTrusted);
      })
      .catch(() => setGoogleEnabled(false));
  }, [searchParams]);

  const handleGoogleLogin = () => {
    const apiUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '');
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-skywork-bg overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[440px] px-6 animate-fade-in">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6 group transition-transform hover:scale-105">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
            Welcome to Coke Agent
          </h1>
          <p className="text-skywork-muted text-center text-sm">
            Experience the next generation of AI-powered presentations
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-skywork-surface/40 backdrop-blur-xl border border-skywork-border p-8 rounded-[24px] shadow-2xl">
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {isLoggingIn ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="animate-spin text-blue-500" size={24} />
                <span className="ml-3 text-skywork-muted">Signing in...</span>
              </div>
            ) : googleEnabled ? (
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg transition-colors shadow-md"
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
            ) : (
              <div className="text-center text-sm text-skywork-muted py-3">
                Google 登录未配置，请联系管理员。
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-skywork-border/50 text-center">
            <p className="text-xs text-skywork-muted">
              By continuing, you agree to our{' '}
              <a href="#" className="text-skywork-accent hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-skywork-accent hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-6 text-[10px] uppercase tracking-widest text-skywork-muted/50 font-semibold">
          <span>Intelligent</span>
          <span>•</span>
          <span>Creative</span>
          <span>•</span>
          <span>Efficient</span>
        </div>
      </div>

      {/* Add animation CSS */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
