import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, List, PlusCircle } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/factures', icon: <List size={20} />, label: 'Liste des factures' },
    { path: '/factures/new', icon: <PlusCircle size={20} />, label: 'Nouvelle facture' },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            {/* Logo pour les écrans moyens et grands */}
            <img 
              src="/md-logo.png" 
              alt="BEST QUALITY" 
              className="h-10 hidden md:block"
            />
            {/* Logo agrandi pour les petits écrans */}
            <img 
              src="/small-md.png" 
              alt="BEST QUALITY" 
              className="h-12 md:hidden"
            />
            {/* Texte uniquement sur les écrans moyens et grands */}
            <span className="text-xl font-bold text-gray-800 hidden md:inline">
              BEST QUALITY
            </span>
          </Link>
          
          {/* Menu desktop */}
          <div className="hidden md:flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Menu hamburger pour mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100">
            <div className="flex flex-col space-y-2 mt-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;