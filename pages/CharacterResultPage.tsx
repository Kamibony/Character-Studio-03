
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { api } from '../services/api';
import type { UserCharacter } from '../types';
import Loader from '../components/Loader';

const CharacterResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [character, setCharacter] = useState<UserCharacter | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchCharacter = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const charDocRef = doc(db, 'user_characters', id);
      const charDoc = await getDoc(charDocRef);

      if (!charDoc.exists()) {
        throw new Error('Postava neexistuje.');
      }

      const charData = { id: charDoc.id, ...charDoc.data() } as UserCharacter;
      setCharacter(charData);

      if (charData.imagePreviewUrl) {
        const url = await getDownloadURL(ref(storage, charData.imagePreviewUrl));
        setImageUrl(url);
      }
    } catch (err: any) {
      setError(err.message || 'Nepodarilo sa načítať dáta postavy.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  const handleGenerate = async () => {
    if (!id || !prompt) {
        setGenerateError("Musíte zadať prompt.");
        return;
    }
    setGenerating(true);
    setGenerateError(null);
    setGeneratedImage(null);
    try {
        const result = await api.generateCharacterVisualization(id, prompt);
        setGeneratedImage(`data:image/png;base64,${result.base64Image}`);
    } catch (err: any) {
        setGenerateError(err.message || "Nepodarilo sa vygenerovať obrázok.");
    } finally {
        setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-16"><Loader /></div>;
  if (error) return <div className="text-center text-red-400 mt-16">{error}</div>;
  if (!character) return <div className="text-center text-gray-400 mt-16">Postava nebola nájdená.</div>;

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Character Details */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-cyan-400 mb-4">{character.characterName}</h1>
        {imageUrl && <img src={imageUrl} alt={character.characterName} className="w-full h-80 object-cover rounded-md mb-4" />}
        <p className="text-gray-300 mb-4">{character.description}</p>
        <div className="flex flex-wrap gap-2">
            {character.keywords.map(keyword => (
                <span key={keyword} className="bg-gray-700 text-cyan-300 px-3 py-1 rounded-full text-sm">{keyword}</span>
            ))}
        </div>
      </div>

      {/* Image Generator */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Generátor obrázkov</h2>
        <p className="text-gray-400 mb-4">Popíšte scénu, do ktorej chcete umiestniť vašu postavu.</p>
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            placeholder="Napr. stojaci na futuristickej streche počas dažďa..."
        />
        <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50"
        >
            {generating && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
            {generating ? 'Generujem...' : 'Generovať obrázok'}
        </button>
        {generateError && <p className="text-red-400 mt-4">{generateError}</p>}
        
        <div className="mt-6 w-full h-96 bg-gray-700 rounded-lg flex items-center justify-center">
            {generating ? <Loader /> : generatedImage ? 
                <img src={generatedImage} alt="Vygenerovaný obrázok" className="w-full h-full object-contain rounded-lg" /> :
                <p className="text-gray-500">Tu sa zobrazí váš vygenerovaný obrázok.</p>
            }
        </div>
      </div>
    </div>
  );
};

export default CharacterResultPage;
