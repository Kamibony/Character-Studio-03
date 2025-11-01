
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { UserCharacter } from '../types';
import Loader from '../components/Loader';
import CharacterCard from '../components/CharacterCard';

const CharacterSelectionPage: React.FC = () => {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedCharacters = await api.getCharacterLibrary();
      // Client-side sorting as requested
      fetchedCharacters.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setCharacters(fetchedCharacters);
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa načítať knižnicu postáv.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  if (loading) {
    return <div className="flex justify-center mt-16"><Loader /></div>;
  }

  if (error) {
    return <div className="text-center text-red-400 mt-16 bg-red-900/50 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vaša Knižnica Postáv</h1>
        <button onClick={fetchCharacters} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">
          Načítať znova
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">Zatiaľ nemáte žiadne postavy.</p>
          <Link 
            to="/upload"
            className="mt-4 inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Vytvoriť prvú postavu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {characters.map(char => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterSelectionPage;
