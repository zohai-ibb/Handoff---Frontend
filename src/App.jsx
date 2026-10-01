import React from 'react';
import Header from './components/Header';

export default function App() {
  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col font-sans">
      {/* --- Fixed Top Header --- */}
      <Header />

      {/* --- Main Screen Content Area --- */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {/* We will insert your next screen component here */}
      </main>
    </div>
  );
}