import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import FactureList from './pages/FactureList';
import CreateFacture from './pages/CreateFacture';
import EditFacture from './pages/EditFacture';
import ViewFacture from './pages/ViewFacture';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/factures" replace />} />
            <Route path="/factures" element={<FactureList />} />
            <Route path="/factures/new" element={<CreateFacture />} />
            <Route path="/factures/:id/edit" element={<EditFacture />} />
            <Route path="/factures/:id" element={<ViewFacture />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;