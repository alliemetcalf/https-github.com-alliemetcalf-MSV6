import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
          <Outlet />
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'text-sm sm:text-base',
            duration: 3000,
            style: {
              maxWidth: '90vw',
              padding: '0.75rem 1rem',
            },
          }} 
        />
      </div>
    </AuthProvider>
  );
}

export default App;
