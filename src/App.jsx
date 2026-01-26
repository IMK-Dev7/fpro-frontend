// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import FactureList from './pages/FactureList';
import CreateFacture from './pages/CreateFacture';
import EditFacture from './pages/EditFacture';
import ViewFacture from './pages/ViewFacture';
import PaiementsFacture from './pages/PaiementsFacture';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto py-4 sm:py-6 px-3 sm:px-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/factures" element={<FactureList />} />
            <Route path="/factures/new" element={<CreateFacture />} />
            <Route path="/factures/:id" element={<ViewFacture />} />
            <Route path="/factures/:id/edit" element={<EditFacture />} />
            <Route path="/factures/:id/paiements" element={<PaiementsFacture />} />
          </Routes>
        </main>
        
        {/* Footer mobile-friendly */}
        <footer className="bg-white border-t border-gray-200 py-4 px-3 sm:px-4">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-600">
                © {new Date().getFullYear()} BEST QUALITY
              </p>
              <p className="text-xs text-gray-500">
                ISMATECH Solutions
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;