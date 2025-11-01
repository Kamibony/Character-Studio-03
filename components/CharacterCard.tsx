
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../services/firebase';
import type { UserCharacter } from '../types';

interface CharacterCardProps {
  character: UserCharacter;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        if (character.imagePreviewUrl) {
          const url = await getDownloadURL(ref(storage, character.imagePreviewUrl));
          setImageUrl(url);
        }
      } catch (error) {
        console.error("Error fetching image URL:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImageUrl();
  }, [character.imagePreviewUrl]);

  return (
    <Link 
        to={`/character/${character.id}`} 
        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-cyan-500/50 transform hover:-translate-y-1 transition-all duration-300"
    >
        <div className="w-full h-56 bg-gray-700 flex items-center justify-center">
            {loading ? (
                <div className="border-2 border-gray-500 border-t-cyan-400 rounded-full w-8 h-8 animate-spin"></div>
            ) : imageUrl ? (
                <img src={imageUrl} alt={character.characterName} className="w-full h-full object-cover" />
            ) : (
                <span className="text-gray-400">Žiadny obrázok</span>
            )}
        </div>
      <div className="p-4">
        <h3 className="font-bold text-lg truncate text-white">{character.characterName}</h3>
        <p className="text-sm text-gray-400 truncate mt-1">{character.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
            {character.keywords.slice(0, 3).map(keyword => (
                <span key={keyword} className="text-xs bg-gray-700 text-cyan-300 px-2 py-1 rounded-full">{keyword}</span>
            ))}
        </div>
      </div>
    </Link>
  );
};

export default CharacterCard;
