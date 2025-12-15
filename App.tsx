import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionKey, setSessionKey] = useState(0); // To force re-render for new chat

  const startNewChat = () => {
    // In a real app, this would generate a new session ID
    // Here we just force a remount of ChatInterface to clear state
    setSessionKey(prev => prev + 1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-skywork-bg text-skywork-text font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        startNewChat={startNewChat}
      />
      
      <main className="flex-1 h-full relative">
        <ChatInterface key={sessionKey} isSidebarOpen={isSidebarOpen} />
      </main>
    </div>
  );
};

export default App;