import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { LoginButton } from './components/LoginButton';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import API, { TokenManager } from './services/api';
import { PPTHistoryItem, SlideDeck } from './types';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionKey, setSessionKey] = useState(0); // To force re-render for new chat
  const [pptHistory, setPptHistory] = useState<PPTHistoryItem[]>([]);
  const [pptToLoad, setPptToLoad] = useState<PPTHistoryItem | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[App] Checking authentication...');
      console.log('[App] Current pathname:', window.location.pathname);
      console.log('[App] Current search:', window.location.search);

      // Check if we're on the callback route
      if (window.location.pathname === '/auth/callback') {
        console.log('[App] On callback route, skipping auth check');
        setIsCheckingAuth(false);
        return;
      }

      const token = TokenManager.getAccessToken();
      console.log('[App] Access token present:', !!token);
      if (token) {
        console.log('[App] Access token (first 50 chars):', token.substring(0, 50));
      }

      if (token) {
        try {
          console.log('[App] Fetching current user...');
          await API.auth.getCurrentUser();
          console.log('[App] User authenticated successfully');
          console.log('[App] Setting isLoggedIn to true');
          setIsLoggedIn(true);
        } catch (error) {
          console.error('[App] Auth check failed:', error);
          console.log('[App] Clearing tokens and setting logged out state');
          TokenManager.clearTokens();
          setIsLoggedIn(false);
        }
      } else {
        console.log('[App] No access token found');
        setIsLoggedIn(false);
      }
      setIsCheckingAuth(false);
      console.log('[App] Auth check complete. isLoggedIn will be:', !!token);
    };
    checkAuth();
  }, []);

  // Watch for isLoggedIn changes
  useEffect(() => {
    console.log('[App] isLoggedIn state changed to:', isLoggedIn);
    console.log('[App] Current pathname:', window.location.pathname);
  }, [isLoggedIn]);

  // Watch for isCheckingAuth changes
  useEffect(() => {
    console.log('[App] isCheckingAuth state changed to:', isCheckingAuth);
  }, [isCheckingAuth]);

  // Load PPT history from database on mount (after login)
  useEffect(() => {
    const loadPPTHistory = async () => {
      if (!isLoggedIn) return;

      try {
        console.log('[App] Loading PPT history from database');
        const response = await API.presentations.getAll(10, 0);

        if (response.success && response.presentations) {
          // Convert database format to frontend format
          const history: PPTHistoryItem[] = response.presentations.map((p: any) => ({
            id: p.id,
            topic: p.topic,
            thumbnail: p.thumbnailData || p.generatedImage,
            slideDeck: {
              id: p.id,
              topic: p.topic,
              theme: p.theme,
              generatedImage: null, // Will be loaded on demand
              htmlContent: null,     // Will be loaded on demand
              analyzedData: null,    // Will be loaded on demand
              createdAt: new Date(p.createdAt).getTime(),
            },
            createdAt: new Date(p.createdAt).getTime(),
            lastModified: new Date(p.lastModified).getTime(),
          }));

          console.log(`[App] Loaded ${history.length} presentations from database`);
          setPptHistory(history);
        }
      } catch (error) {
        console.error('[App] Failed to load PPT history from database:', error);
        // Fallback to localStorage if database fails
        try {
          const saved = localStorage.getItem('ppt-history');
          if (saved) {
            setPptHistory(JSON.parse(saved));
            console.log('[App] Loaded PPT history from localStorage as fallback');
          }
        } catch (fallbackError) {
          console.error('[App] Fallback to localStorage also failed:', fallbackError);
        }
      }
    };

    loadPPTHistory();
  }, [isLoggedIn]);

  // Backup PPT history to localStorage (optional fallback)
  useEffect(() => {
    if (pptHistory.length > 0) {
      try {
        // Only save metadata to localStorage as backup, not full content
        const backup = pptHistory.map(item => ({
          id: item.id,
          topic: item.topic,
          createdAt: item.createdAt,
          lastModified: item.lastModified,
        }));
        localStorage.setItem('ppt-history-backup', JSON.stringify(backup));
      } catch (error: any) {
        // Silently fail - database is the primary storage now
        console.warn('[App] localStorage backup failed (not critical):', error.message);
      }
    }
  }, [pptHistory]);

  const startNewChat = () => {
    // In a real app, this would generate a new session ID
    // Here we just force a remount of ChatInterface to clear state
    setSessionKey(prev => prev + 1);
  };

  // Save PPT to history (called by ChatInterface)
  const savePPTToHistory = async (deck: SlideDeck) => {
    const now = Date.now();
    const id = deck.id || `ppt-${now}`;

    // Extract title from topic if it's too long (safety measure)
    const extractTitle = (topic: string): string => {
      if (!topic) return 'Untitled Presentation';
      const firstLine = topic.split('\n')[0];
      const title = firstLine.length > 200 ? firstLine.substring(0, 197) + '...' : firstLine;
      return title || 'Untitled Presentation';
    };

    const safeTopicTitle = extractTitle(deck.topic);

    console.log('[App] Saving PPT to database:', {
      id,
      originalTopic: deck.topic,
      originalTopicLength: deck.topic?.length,
      safeTopicTitle,
      safeTopicLength: safeTopicTitle.length,
      theme: deck.theme,
      hasGeneratedImage: !!deck.generatedImage,
      hasHtmlContent: !!deck.htmlContent,
      hasAnalyzedData: !!deck.analyzedData,
    });

    try {
      // For HTML mode, we need to save the HTML content, not the blob URL
      // Blob URLs are session-specific and won't work after page reload
      let imageToSave = deck.generatedImage;
      if (deck.isHtmlMode && deck.htmlContent) {
        // Create a data URL from HTML content for persistent storage
        const htmlBase64 = btoa(unescape(encodeURIComponent(deck.htmlContent)));
        imageToSave = `data:text/html;base64,${htmlBase64}`;
        console.log('[App] Converting HTML to data URL for storage, length:', imageToSave.length);
      }

      // Save to database
      const presentationData = {
        topic: safeTopicTitle,  // Use safe truncated title instead of full topic
        theme: deck.theme,
        generatedImage: imageToSave, // For HTML mode, this will be data URL, for image mode, base64 image
        htmlContent: deck.htmlContent,
        thumbnailData: imageToSave, // Use same as generated image for now
        analyzedData: deck.analyzedData,
        isHtmlMode: deck.isHtmlMode, // Save the mode flag
        metadata: deck.selectedStyle ? {
          styleId: deck.selectedStyle.id,
          styleName: deck.selectedStyle.title,
        } : null,
      };

      const response = await API.presentations.save(presentationData);

      if (response.success && response.presentation) {
        console.log('[App] PPT saved to database successfully:', response.presentation.id);

        // Update local history with database ID
        const historyItem: PPTHistoryItem = {
          id: response.presentation.id,
          topic: safeTopicTitle,  // Use safe truncated title
          thumbnail: deck.generatedImage,
          slideDeck: {
            ...deck,
            topic: safeTopicTitle,  // Update deck topic as well
            id: response.presentation.id,
            createdAt: new Date(response.presentation.createdAt).getTime(),
          },
          createdAt: new Date(response.presentation.createdAt).getTime(),
          lastModified: new Date(response.presentation.lastModified).getTime(),
        };

        setPptHistory(prev => {
          // Check if already exists, update it
          const existing = prev.findIndex(item => item.id === response.presentation.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = historyItem;
            console.log('[App] Updated existing PPT in history');
            return updated;
          }
          // Add new item at the beginning
          console.log('[App] Added new PPT to history, sessionKey:', sessionKey);
          return [historyItem, ...prev];
        });
      }
    } catch (error) {
      console.error('[App] Failed to save PPT to database:', error);
      // Fallback to localStorage
      try {
        const historyItem: PPTHistoryItem = {
          id,
          topic: safeTopicTitle,  // Use safe truncated title
          thumbnail: deck.generatedImage,
          slideDeck: { ...deck, topic: safeTopicTitle, id, createdAt: deck.createdAt || now },
          createdAt: deck.createdAt || now,
          lastModified: now
        };
        const saved = localStorage.getItem('ppt-history') || '[]';
        const history = JSON.parse(saved);
        history.unshift(historyItem);
        localStorage.setItem('ppt-history', JSON.stringify(history.slice(0, 5)));
        console.log('[App] Saved to localStorage as fallback');
        setPptHistory(prev => [historyItem, ...prev]);
      } catch (fallbackError) {
        console.error('[App] Fallback save also failed:', fallbackError);
      }
    }
  };

  // Load PPT from history (called by Sidebar)
  const loadPPTFromHistory = async (historyItem: PPTHistoryItem) => {
    console.log('[App] Load PPT from history requested:', {
      id: historyItem.id,
      topic: historyItem.topic,
      hasGeneratedImage: !!historyItem.slideDeck?.generatedImage,
      hasHtmlContent: !!historyItem.slideDeck?.htmlContent,
    });

    try {
      // If the slideDeck doesn't have full data, load it from database
      if (!historyItem.slideDeck.generatedImage && historyItem.id) {
        console.log('[App] Slide deck missing generatedImage, loading full PPT data from database:', historyItem.id);
        const response = await API.presentations.getById(historyItem.id);

        if (response.success && response.presentation) {
          const p = response.presentation;
          const fullHistoryItem: PPTHistoryItem = {
            ...historyItem,
            slideDeck: {
              id: p.id,
              topic: p.topic,
              theme: p.theme,
              generatedImage: p.generatedImage,
              htmlContent: p.htmlContent,
              analyzedData: p.analyzedData,
              metadata: p.metadata,
              createdAt: new Date(p.createdAt).getTime(),
            },
          };
          console.log('[App] Full PPT data loaded from database, setting pptToLoad');
          setPptToLoad(fullHistoryItem);
          console.log('[App] pptToLoad state updated with full data');
          return;
        }
      }

      // If already has full data or database fetch failed, use existing data
      console.log('[App] Using existing history item data, setting pptToLoad');
      setPptToLoad(historyItem);
      console.log('[App] pptToLoad state updated with existing data');
    } catch (error) {
      console.error('[App] Failed to load full PPT data:', error);
      // Fallback to existing data
      console.log('[App] Error occurred, falling back to existing data');
      setPptToLoad(historyItem);
      console.log('[App] pptToLoad state updated with fallback data');
    }
  };

  // Clear pptToLoad after it's been processed by ChatInterface
  const clearPptToLoad = useCallback(() => {
    setPptToLoad(null);
  }, []);

  const handleLoginSuccess = () => {
    console.log('[App] Login success handler called');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const MainApp = () => (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-skywork-bg text-skywork-text font-sans">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-6 py-3 bg-skywork-surface/50 backdrop-blur-sm border-b border-skywork-border shadow-sm z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Coke Agent</h1>
          <span className="text-sm text-skywork-muted">智能助手平台</span>
        </div>
        <LoginButton onLogout={handleLogout} />
      </header>

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          startNewChat={startNewChat}
          pptHistory={pptHistory}
          onLoadPPT={loadPPTFromHistory}
        />

        <main className="flex-1 h-full relative">
          <ChatInterface
            key={sessionKey}
            isSidebarOpen={isSidebarOpen}
            onSavePPTToHistory={savePPTToHistory}
            pptToLoad={pptToLoad}
            onClearPptToLoad={clearPptToLoad}
          />
        </main>
      </div>
    </div>
  );  // End of MainApp component

  // Show loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-skywork-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-skywork-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/login"
          element={
            isLoggedIn ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route
          path="/"
          element={
            isLoggedIn ? <MainApp /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;