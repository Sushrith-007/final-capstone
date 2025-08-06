import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// Store
import { store, persistor } from './store';
import { checkAuthStatus } from './store/slices/authSlice';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';

const App: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check authentication status on app load
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <PersistGate loading={null} persistor={persistor}>
      <>
        <Helmet>
          <title>E-Commerce PWA</title>
          <meta name="description" content="Shop online with our Progressive Web Application" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="canonical" href={window.location.href} />
        </Helmet>

        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <a href="/" className="text-2xl font-bold text-gray-900">
                    E-Commerce PWA
                  </a>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Home
                  </a>
                  <a href="/products" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Products
                  </a>
                  <a href="/cart" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Cart
                  </a>
                  <a href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Login
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* 404 Route */}
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600 mb-8">Page not found</p>
                      <a
                        href="/"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Go Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-base text-gray-400">
                  &copy; 2024 E-Commerce PWA. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </>
    </PersistGate>
  );
};

export default App; 