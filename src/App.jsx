import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col font-sans pb-20">
      {/* --- Fixed Top Header Navbar --- */}
      <Header />

      {/* --- Screen Content Body --- */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {activeTab === 'Home' && (
          <div className="bg-white p-4 rounded-xl border border-black/10">
            <h2 className="text-base font-semibold text-gray-800">Home Screen</h2>
            <p className="text-xs text-gray-500 mt-1">
              Welcome to HandOff Instrument Register.
            </p>
          </div>
        )}

        {activeTab === 'Items' && (
          <div className="bg-white p-4 rounded-xl border border-black/10">
            <h2 className="text-base font-semibold text-gray-800">Items Screen</h2>
            <p className="text-xs text-gray-500 mt-1">
              Inventory and asset search.
            </p>
          </div>
        )}

        {activeTab === 'Issue' && (
          <div className="bg-white p-4 rounded-xl border border-black/10">
            <h2 className="text-base font-semibold text-gray-800">Issue Screen</h2>
            <p className="text-xs text-gray-500 mt-1">
              Checkout wizard and QR scanner.
            </p>
          </div>
        )}

        {activeTab === 'Due' && (
          <div className="bg-white p-4 rounded-xl border border-black/10">
            <h2 className="text-base font-semibold text-gray-800">Due Tracker</h2>
            <p className="text-xs text-gray-500 mt-1">
              Return processing and overdue tracker.
            </p>
          </div>
        )}

        {activeTab === 'People' && (
          <div className="bg-white p-4 rounded-xl border border-black/10">
            <h2 className="text-base font-semibold text-gray-800">People Directory</h2>
            <p className="text-xs text-gray-500 mt-1">
              Scientists and project staff directory.
            </p>
          </div>
        )}
      </main>

      {/* --- Fixed Bottom Footer --- */}
      <Footer currentTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}