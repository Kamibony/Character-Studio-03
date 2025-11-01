
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../services/firebase';

const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-cyan-400">
          Character Studio
        </Link>
        <nav className="flex items-center space-x-4">
          {user && (
            <>
              <Link to="/" className="text-gray-300 hover:text-white transition">Knižnica</Link>
              <Link to="/upload" className="text-gray-300 hover:text-white transition">Vytvoriť novú</Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Odhlásiť sa
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
