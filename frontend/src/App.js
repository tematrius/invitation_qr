import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import HomePage from './pages/HomePage';
import CreateEventPage from './pages/CreateEventPage';
import AdminDashboard from './pages/AdminDashboard';
import GuestManagement from './pages/GuestManagement';
import ScannerPage from './pages/ScannerPage';
import ExportsPage from './pages/ExportsPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Configuration des toasts */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />

          {/* Routes principales */}
          <Routes>
            {/* Page d'accueil */}
            <Route path="/" element={<HomePage />} />
            
            {/* Création d'événement */}
            <Route path="/create-event" element={<CreateEventPage />} />
            
            {/* Dashboard administrateur */}
            <Route path="/admin/:adminCode" element={<AdminDashboard />} />
            
            {/* Gestion des invités */}
            <Route path="/admin/:adminCode/guests" element={<GuestManagement />} />
            
            {/* Scanner QR */}
            <Route path="/scan/:adminCode" element={<ScannerPage />} />
            
            {/* Page d'exports */}
            <Route path="/admin/:adminCode/exports" element={<ExportsPage />} />
            
            {/* Page 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
