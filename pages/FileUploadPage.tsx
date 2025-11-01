
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../services/firebase';
import { api } from '../services/api';
import Loader from '../components/Loader';

const FileUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCreate = async () => {
    if (!file || !user) {
      setError("Musíte vybrať obrázok a byť prihlásený.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload file to Storage
      const gcsPath = `user_uploads/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, gcsPath);
      const uploadResult = await uploadBytes(storageRef, file);
      const fullPath = uploadResult.metadata.fullPath;

      // 2. Call Cloud Function with GCS path
      const newCharacter = await api.createCharacterProfile(fullPath);

      // 3. Navigate to the new character's page
      navigate(`/character/${newCharacter.id}`);

    } catch (err: any) {
      setError(err.message || "Nepodarilo sa vytvoriť profil postavy.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Vytvoriť Novú Postavu</h1>
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
        <label
          htmlFor="file-upload"
          className="relative block w-full h-64 border-2 border-dashed border-gray-500 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:border-cyan-400 transition"
        >
          {preview ? (
            <img src={preview} alt="Náhľad" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-center">
              <p className="text-gray-400">Kliknite pre výber obrázku</p>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
            </div>
          )}
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />

        {error && (
            <div className="mt-4 p-3 text-sm text-red-300 bg-red-900/50 rounded-lg">
                {error}
            </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleCreate}
            disabled={!file || loading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
          >
            {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
            {loading ? 'Spracovávam...' : 'Vytvoriť Profil Postavy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadPage;
