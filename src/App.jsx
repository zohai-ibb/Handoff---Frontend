import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomeScreen from './pages/HomeScreen';

const ItemsScreen = () => (
  <div className="bg-white p-4 rounded-xl border border-black/10">
    <h2 className="text-sm font-semibold text-gray-800">Inventory Items</h2>
  </div>
);

const IssueScreen = () => (
  <div className="bg-white p-4 rounded-xl border border-black/10">
    <h2 className="text-sm font-semibold text-gray-800">Issue Wizard</h2>
  </div>
);

const DueScreen = () => (
  <div className="bg-white p-4 rounded-xl border border-black/10">
    <h2 className="text-sm font-semibold text-gray-800">Due & Overdue Items</h2>
  </div>
);

const PeopleScreen = () => (
  <div className="bg-white p-4 rounded-xl border border-black/10">
    <h2 className="text-sm font-semibold text-gray-800">Directory</h2>
  </div>
);

export default function App() {
  const [toast, setToast] = useState(null);

  return (
    <Router>
      <Layout toastMessage={toast}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/items" element={<ItemsScreen />} />
          <Route path="/issue" element={<IssueScreen />} />
          <Route path="/due" element={<DueScreen />} />
          <Route path="/people" element={<PeopleScreen />} />
        </Routes>
      </Layout>
    </Router>
  );
}