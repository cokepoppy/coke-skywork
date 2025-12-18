import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { PPTHistoryItem, SlideDeck } from './types';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionKey, setSessionKey] = useState(0); // To force re-render for new chat
  const [pptHistory, setPptHistory] = useState<PPTHistoryItem[]>([]);
  const [pptToLoad, setPptToLoad] = useState<PPTHistoryItem | null>(null);

  // Load PPT history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ppt-history');
    if (saved) {
      try {
        setPptHistory(JSON.parse(saved));
      } catch (error) {
        console.error('[App] Failed to load PPT history:', error);
      }
    }
  }, []);

  // Save PPT history to localStorage whenever it changes
  useEffect(() => {
    if (pptHistory.length > 0) {
      try {
        const historyJSON = JSON.stringify(pptHistory);
        console.log('[App] Saving history to localStorage, size:', (historyJSON.length / 1024).toFixed(2), 'KB');
        localStorage.setItem('ppt-history', historyJSON);
      } catch (error: any) {
        console.error('[App] Failed to save to localStorage:', error.message);

        if (error.name === 'QuotaExceededError') {
          console.warn('[App] localStorage quota exceeded, cleaning up old entries...');

          // Keep only the most recent 3 items
          const reducedHistory = pptHistory.slice(0, 3);
          try {
            localStorage.setItem('ppt-history', JSON.stringify(reducedHistory));
            console.log('[App] Successfully saved after cleanup');
            setPptHistory(reducedHistory);
          } catch (retryError) {
            console.error('[App] Still failed after cleanup, clearing all history');
            localStorage.removeItem('ppt-history');
            setPptHistory([]);
          }
        }
      }
    }
  }, [pptHistory]);

  const startNewChat = () => {
    // In a real app, this would generate a new session ID
    // Here we just force a remount of ChatInterface to clear state
    setSessionKey(prev => prev + 1);
  };

  // Save PPT to history (called by ChatInterface)
  const savePPTToHistory = (deck: SlideDeck) => {
    const now = Date.now();
    const id = deck.id || `ppt-${now}`;

    // Remove originalImage from analyzedData to save space
    const deckToSave = { ...deck };
    if (deckToSave.analyzedData?.originalImage) {
      deckToSave.analyzedData = {
        ...deckToSave.analyzedData,
        originalImage: undefined  // Will be restored from generatedImage when loading
      };
    }

    const historyItem: PPTHistoryItem = {
      id,
      topic: deck.topic,
      thumbnail: deck.generatedImage,
      slideDeck: { ...deckToSave, id, createdAt: deck.createdAt || now },
      createdAt: deck.createdAt || now,
      lastModified: now
    };

    console.log('[App] Saving PPT to history:', {
      id,
      hasAnalyzedData: !!historyItem.slideDeck.analyzedData,
      analyzedDataSize: historyItem.slideDeck.analyzedData ? JSON.stringify(historyItem.slideDeck.analyzedData).length : 0
    });

    setPptHistory(prev => {
      // Check if already exists, update it
      const existing = prev.findIndex(item => item.id === id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = historyItem;
        return updated;
      }
      // Add new item at the beginning, keep only last 5 items
      const newHistory = [historyItem, ...prev];
      return newHistory.slice(0, 5);
    });
  };

  // Load PPT from history (called by Sidebar)
  const loadPPTFromHistory = (historyItem: PPTHistoryItem) => {
    console.log('[App] Load PPT from history requested:', historyItem.id);
    setPptToLoad(historyItem);
  };

  // Clear pptToLoad after it's been processed by ChatInterface
  const clearPptToLoad = () => {
    setPptToLoad(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-skywork-bg text-skywork-text font-sans">
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
          pptHistory={pptHistory}
          onSavePPTToHistory={savePPTToHistory}
          pptToLoad={pptToLoad}
          onClearPptToLoad={clearPptToLoad}
        />
      </main>
    </div>
  );
};

export default App;