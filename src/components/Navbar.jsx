import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, List, PlusCircle, Home, CreditCard } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/factures', icon: <List size={20} />, label: 'Factures' },
    { path: '/factures/new', icon: <PlusCircle size={20} />, label: 'Nouvelle' },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            {/* Logo desktop */}
            <img 
              src="/md-logo.png" 
              alt="BEST QUALITY" 
              className="h-8 sm:h-10 hidden md:block"
            />
            {/* Logo mobile */}
            <img 
              src="/small-md.png" 
              alt="BEST QUALITY" 
              className="h-10 sm:h-12 md:hidden"
            />
            {/* Texte */}
            <span className="text-lg sm:text-xl font-bold text-gray-800 hidden sm:inline">
              BEST QUALITY
            </span>
          </Link>
          
          {/* Menu desktop */}
          <div className="hidden md:flex space-x-2 lg:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
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

          {/* Menu hamburger mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            aria-label="Menu"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden pb-3 border-t border-gray-100 bg-white animate-slideDown">
            <div className="flex flex-col space-y-1 mt-2">
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