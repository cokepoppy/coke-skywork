import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TokenManager } from '../services/api';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('[AuthCallback] Component mounted');
    console.log('[AuthCallback] Current URL:', window.location.href);
    console.log('[AuthCallback] Current pathname:', window.location.pathname);
    console.log('[AuthCallback] Search params:', Object.fromEntries(searchParams.entries()));

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    console.log('[AuthCallback] Access token present:', !!accessToken);
    console.log('[AuthCallback] Refresh token present:', !!refreshToken);
    if (accessToken) {
      console.log('[AuthCallback] Access token (first 50 chars):', accessToken.substring(0, 50));
    }

    if (!accessToken || !refreshToken) {
      // No tokens in query, go back to login
      console.error('[AuthCallback] Missing tokens in URL - accessToken:', !!accessToken, 'refreshToken:', !!refreshToken);
      navigate('/login?error=missing_tokens', { replace: true });
      return;
    }

    try {
      // Save tokens
      console.log('[AuthCallback] Saving tokens to localStorage...');
      TokenManager.setTokens(accessToken, refreshToken);
      console.log('[AuthCallback] Tokens saved successfully');

      // Verify tokens were saved
      const savedToken = TokenManager.getAccessToken();
      console.log('[AuthCallback] Verified token in localStorage:', !!savedToken);

      // Redirect to home - use window.location to force full page reload
      // This ensures App component re-initializes and checks auth state
      console.log('[AuthCallback] Redirecting to home page with full reload...');

      setTimeout(() => {
        console.log('[AuthCallback] Executing window.location.href = "/"');
        window.location.href = '/';
      }, 100);

    } catch (error) {
      console.error('[AuthCallback] Error saving tokens:', error);
      window.location.href = '/login?error=auth_failed';
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-skywork-bg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white">Signing you in...</h2>
        <p className="text-skywork-muted mt-2">Please wait a moment.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
