import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../services/firebase';
import { api } from '../services/api';

const FileUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCorsError, setIsCorsError] = useState(false);
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
    setIsCorsError(false);

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
      if (err instanceof TypeError && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
          setIsCorsError(true);
          setError("Chyba Cross-Origin (CORS): Váš prehliadač zablokoval požiadavku z bezpečnostných dôvodov. Je potrebné nakonfigurovať váš Firebase Storage bucket. Postupujte podľa pokynov nižšie.");
      } else {
          setIsCorsError(false);
          setError(err.message || "Nepodarilo sa vytvoriť profil postavy.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const corsJsonContent = `[
  {
    "origin": ["${window.location.origin}"],
    "method": ["GET", "POST", "PUT", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "X-Goog-Resumable",
      "X-Goog-Upload-Protocol"
    ],
    "maxAgeSeconds": 3600
  }
]`;

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
            <div className="mt-4 p-4 text-sm text-red-300 bg-red-900/50 rounded-lg">
                <p className="font-bold">Chyba pri nahrávaní</p>
                <p>{error}</p>
                 {isCorsError && (
                    <div className="mt-3 pt-3 border-t border-red-800">
                        <p className="font-bold text-base text-white mb-2">Ako opraviť CORS chybu:</p>
                        <p className="text-xs text-gray-300 mb-1">1. Vytvorte súbor s názvom <code className="bg-gray-900 px-1 rounded">cors.json</code> s týmto obsahom:</p>
                        <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto text-white my-2">
                            <code>
                                {corsJsonContent}
                            </code>
                        </pre>
                        <p className="text-xs text-gray-300 mt-2 mb-1">2. Nainštalujte si Google Cloud CLI (<a href="https://cloud.google.com/sdk/docs/install" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">gcloud</a>).</p>
                        <p className="text-xs text-gray-300 mt-2 mb-1">3. Spustite tento príkaz v termináli (v rovnakom priečinku ako <code className="bg-gray-900 px-1 rounded">cors.json</code>):</p>
                        <div className="p-2 bg-gray-900 rounded mt-1">
                            <code className="text-white font-mono select-all flex-grow text-xs break-all">
                                {`gcloud storage buckets update gs://${storage.app.options.storageBucket} --cors-file=cors.json`}
                            </code>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Tento príkaz povolí doméne vašej aplikácie pristupovať k Firebase Storage.</p>
                    </div>
                )}
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