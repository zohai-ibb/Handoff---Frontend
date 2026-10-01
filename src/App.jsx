import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeScreen from './pages/HomeScreen';
import ReceiveScreen from './pages/ReceiveScreen';
import AddInstrumentScreen from './pages/AddInstrumentScreen';
import IssueWizardScreen from './pages/IssueWizardScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'receive' | 'add-item'
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4200);
  };

  const handleActionClick = (action) => {
    if (action === 'Issue') {
      setActiveTab('Issue');
      setCurrentView('home');
    } else if (action === 'Receive') {
      setCurrentView('receive');
    } else if (action === 'Add item') {
      setCurrentView('add-item');
    } else {
      setActiveTab(action);
      setCurrentView('home');
    }
  };

  const handleFooterTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col font-sans pb-20 relative">
      {/* --- Fixed Top Header Navbar --- */}
      <Header />

      {/* --- Main Viewport Area --- */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {activeTab === 'Home' && currentView === 'home' && (
          <HomeScreen onNavigate={handleActionClick} />
        )}

        {currentView === 'receive' && (
          <ReceiveScreen
            onBack={() => setCurrentView('home')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'add-item' && (
          <AddInstrumentScreen
            onBack={() => setCurrentView('home')}
            onShowToast={showToast}
          />
        )}

        {/* --- Render Issue Wizard Screen for Tab 3 --- */}
        {activeTab === 'Issue' && currentView === 'home' && (
          <IssueWizardScreen
            onBack={() => setActiveTab('Home')}
            onShowToast={showToast}
            onIssueComplete={() => setActiveTab('Home')}
          />
        )}

        {activeTab === 'Items' && currentView === 'home' && (
          <div className="bg-white p-4 rounded-2xl border border-black/10">
            <h2 className="text-base font-semibold text-gray-800">Items Screen</h2>
            <p className="text-xs text-gray-500 mt-1">Inventory list & filters.</p>
          </div>
        )}

        {activeTab === 'Due' && currentView === 'home' && (
          <div className="bg-white p-4 rounded-2xl border border-black/10">
            <h2 className="text-base font-semibold text-gray-800">Due Tracker</h2>
            <p className="text-xs text-gray-500 mt-1">Return & overdue loans tracking.</p>
          </div>
        )}

        {activeTab === 'People' && currentView === 'home' && (
          <div className="bg-white p-4 rounded-2xl border border-black/10">
            <h2 className="text-base font-semibold text-gray-800">People Directory</h2>
            <p className="text-xs text-gray-500 mt-1">Scientist directory.</p>
          </div>
        )}
      </main>

      {/* --- Toast Banner Notification --- */}
      {toast && (
        <div className="fixed bottom-[72px] left-4 right-4 z-50 max-w-md mx-auto bg-[#1b1a18] text-white text-[12px] leading-relaxed rounded-xl p-3 shadow-2xl border border-white/10 animate-fade-in flex items-center justify-between">
          <span>{toast}</span>
        </div>
      )}

      {/* --- Fixed Bottom Footer Nav --- */}
      <Footer currentTab={activeTab} onTabChange={handleFooterTabChange} />
    </div>
  );
}