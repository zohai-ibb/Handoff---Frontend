import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeScreen from './pages/HomeScreen';
import ItemsScreen from './pages/ItemsScreen';
import ReceiveScreen from './pages/ReceiveScreen';
import AddInstrumentScreen from './pages/AddInstrumentScreen';
import IssueWizardScreen from './pages/IssueWizardScreen';
import DueScreen from './pages/DueScreen';
import PeopleScreen from './pages/PeopleScreen';
import ProfileScreen from './pages/ProfileScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';

export default function App() {
  const [user, setUser] = useState(null); // Current authenticated user profile
  const [token, setToken] = useState(null); // JWT Bearer token
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  const [activeTab, setActiveTab] = useState('Home');
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'receive' | 'add-item' | 'profile'
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4200);
  };

  // Handle successful Auth -> Redirect to Home
  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setActiveTab('Home');
    setCurrentView('home');
    showToast(`Welcome back, ${userData.name}!`);
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

  const handleSelectInstrumentFromInventory = (instrument) => {
    showToast(`Selected ${instrument.name} (${instrument.assetId})`);
    setActiveTab('Issue');
    setCurrentView('home');
  };

  // -------------------------------------------------------------
  // If User is Not Authenticated -> Show Login or Register Screen
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] flex flex-col font-sans relative">
        <Header userPhotoUrl={null} onProfileClick={() => {}} />
        <main className="flex-1 p-4 max-w-md mx-auto w-full">
          {authView === 'login' ? (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onNavigateToRegister={() => setAuthView('register')}
            />
          ) : (
            <RegisterScreen
              onRegisterSuccess={handleAuthSuccess}
              onNavigateToLogin={() => setAuthView('login')}
            />
          )}
        </main>
        {toast && (
          <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-[#1b1a18] text-white text-[12px] p-3 rounded-xl shadow-2xl border border-white/10 flex items-center justify-between">
            <span>{toast}</span>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Main Authenticated Application Layout
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col font-sans pb-20 relative">
      {/* Fixed Header Navbar with Profile Click Handler */}
      <Header
        userPhotoUrl={user?.photo_path || null}
        onProfileClick={() => setCurrentView('profile')}
      />

      {/* Main Viewport Area */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {/* --- Profile Screen View --- */}
        {currentView === 'profile' && (
          <ProfileScreen
            onBack={() => setCurrentView('home')}
            onShowToast={showToast}
          />
        )}

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

        {activeTab === 'Issue' && currentView === 'home' && (
          <IssueWizardScreen
            onBack={() => setActiveTab('Home')}
            onShowToast={showToast}
            onIssueComplete={() => setActiveTab('Home')}
          />
        )}

        {activeTab === 'Items' && currentView === 'home' && (
          <ItemsScreen onSelectInstrument={handleSelectInstrumentFromInventory} />
        )}

        {activeTab === 'Due' && currentView === 'home' && (
          <DueScreen onShowToast={showToast} />
        )}

        {activeTab === 'People' && currentView === 'home' && (
          <PeopleScreen onShowToast={showToast} />
        )}
      </main>

      {/* Toast Banner Notification */}
      {toast && (
        <div className="fixed bottom-[72px] left-4 right-4 z-50 max-w-md mx-auto bg-[#1b1a18] text-white text-[12px] leading-relaxed rounded-xl p-3 shadow-2xl border border-white/10 animate-fade-in flex items-center justify-between">
          <span>{toast}</span>
        </div>
      )}

      {/* Fixed Bottom Footer Nav */}
      <Footer currentTab={activeTab} onTabChange={handleFooterTabChange} />
    </div>
  );
}