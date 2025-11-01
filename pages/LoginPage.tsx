
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, AuthError } from 'firebase/auth';
import { auth, googleProvider, firebaseConfig } from '../services/firebase';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setUnauthorizedDomain(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err: unknown) {
      const authError = err as AuthError;
      console.error(authError);
      if (authError.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setUnauthorizedDomain(domain);
        setError(
          `Táto doména nie je autorizovaná na prihlásenie. Pre pokračovanie ju prosím pridajte do Firebase.`
        );
      } else {
        setError(authError.message || 'Prihlásenie zlyhalo. Skúste to prosím znova.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (unauthorizedDomain) {
        navigator.clipboard.writeText(unauthorizedDomain);
        // Optional: Add a "Copied!" feedback state
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center text-white">Vitajte v Character Studio</h1>
        <p className="text-center text-gray-400">Prihláste sa a začnite tvoriť svoje postavy.</p>
        
        {error && (
            <div className="p-4 text-sm text-red-300 bg-red-900/50 rounded-lg break-words">
                <p className="font-bold">Chyba pri prihlásení</p>
                <p>{error}</p>
                {unauthorizedDomain && (
                    <div className="mt-3 pt-3 border-t border-red-800">
                        <p className="text-xs text-gray-300 mb-1">1. Skopírujte túto doménu:</p>
                        <div className="flex items-center gap-2 p-2 bg-gray-900 rounded">
                            <code className="text-white font-mono select-all flex-grow">{unauthorizedDomain}</code>
                            <button onClick={copyToClipboard} className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">Kopírovať</button>
                        </div>
                        <p className="text-xs text-gray-300 mt-2 mb-1">2. Pridajte ju do autorizovaných domén vo Firebase:</p>
                        <a 
                          href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full text-center py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md text-sm"
                        >
                          Otvoriť nastavenia Firebase
                        </a>
                    </div>
                )}
            </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex justify-center items-center gap-3 py-3 px-4 font-semibold rounded-lg bg-white text-gray-800 hover:bg-gray-200 transition disabled:opacity-50"
        >
          {loading ? 'Pripájam...' : 'Prihlásiť sa cez Google'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
