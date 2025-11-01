
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import CharacterSelectionPage from './pages/CharacterSelectionPage';
import FileUploadPage from './pages/FileUploadPage';
import CharacterResultPage from './pages/CharacterResultPage';
import Header from './components/Header';
import Loader from './components/Loader';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader />
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <CharacterSelectionPage />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <FileUploadPage />
              </ProtectedRoute>
            } />
            <Route path="/character/:id" element={
              <ProtectedRoute>
                <CharacterResultPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
