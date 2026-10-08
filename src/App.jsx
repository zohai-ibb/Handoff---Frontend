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
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authView, setAuthView] = useState('login');

  const [activeTab, setActiveTab] = useState('Home');
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'receive' | 'add-item' | 'profile'
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4200);
  };

  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setActiveTab('Home');
    setCurrentView('home');
    showToast(`Welcome back, ${userData.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setAuthView('login');
    setCurrentView('home');
    setActiveTab('Home');
    showToast('Signed out successfully.');
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
    if (tabId === 'Profile') {
      setCurrentView('profile');
    } else {
      setCurrentView('home');
    }
  };

  // Helper function to reset both tab and view state back to Home
  const handleBackToHome = () => {
    setActiveTab('Home');
    setCurrentView('home');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] flex flex-col font-sans relative">
        <Header user={null} />
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

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col font-sans pb-20 relative">
      <Header
        user={user}
        onProfileClick={() => {
          setActiveTab('Profile');
          setCurrentView('profile');
        }}
      />

      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {currentView === 'profile' && (
          <ProfileScreen
            user={user}
            onBack={handleBackToHome}
            onLogout={handleLogout}
            onShowToast={showToast}
          />
        )}

        {currentView === 'home' && activeTab === 'Home' && (
          <HomeScreen onNavigate={handleActionClick} />
        )}

        {currentView === 'receive' && (
          <ReceiveScreen
            onBack={handleBackToHome}
            onShowToast={showToast}
          />
        )}

        {currentView === 'add-item' && (
          <AddInstrumentScreen
            onBack={handleBackToHome}
            onShowToast={showToast}
          />
        )}

        {currentView === 'home' && activeTab === 'Issue' && (
          <IssueWizardScreen
            onBack={handleBackToHome}
            onShowToast={showToast}
            onIssueComplete={handleBackToHome}
          />
        )}

        {currentView === 'home' && activeTab === 'Items' && (
          <ItemsScreen onSelectInstrument={(inst) => {
            showToast(`Selected ${inst.name}`);
            setActiveTab('Issue');
            setCurrentView('home');
          }} />
        )}

        {/* --- Render Due Tracker with Back-to-Home Handler --- */}
        {currentView === 'home' && activeTab === 'Due' && (
          <DueScreen
            onBack={handleBackToHome}
            onShowToast={showToast}
          />
        )}

        {currentView === 'home' && activeTab === 'People' && (
          <PeopleScreen onShowToast={showToast} />
        )}
      </main>

      {toast && (
        <div className="fixed bottom-[72px] left-4 right-4 z-50 max-w-md mx-auto bg-[#1b1a18] text-white text-[12px] leading-relaxed rounded-xl p-3 shadow-2xl border border-white/10 animate-fade-in flex items-center justify-between">
          <span>{toast}</span>
        </div>
      )}

      <Footer currentTab={activeTab} onTabChange={handleFooterTabChange} />
    </div>
  );
}