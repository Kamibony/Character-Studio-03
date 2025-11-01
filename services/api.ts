
import { auth } from './firebase';
import { UserCharacter } from '../types';

// IMPORTANT: Replace this with your actual deployed Cloud Function URL
const BASE_URL = "https://us-central1-character-studio-comics.cloudfunctions.net";
const API_ENDPOINTS = {
  getCharacterLibrary: `${BASE_URL}/getCharacterLibrary`,
  createCharacterProfile: `${BASE_URL}/createCharacterProfile`,
  generateCharacterVisualization: `${BASE_URL}/generateCharacterVisualization`
};

interface CreateProfileArgs { firstFilePath: string; }
interface GenerateVisArgs { characterId: string; prompt: string; }
interface GenerateVisResult { base64Image: string; }

async function robustFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP chyba! Status: ${response.status}` }));
        const message = errorData.error || `Neznáma chyba servera. Status: ${response.status}`;
        throw new Error(message);
    }
    return response.json();
}

export const api = {
  getCharacterLibrary: async (): Promise<UserCharacter[]> => {
    return robustFetch<UserCharacter[]>(API_ENDPOINTS.getCharacterLibrary, { method: 'POST' });
  },
  
  createCharacterProfile: async (firstFilePath: string): Promise<UserCharacter> => {
     return robustFetch<UserCharacter>(API_ENDPOINTS.createCharacterProfile, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstFilePath })
    });
  },

  generateCharacterVisualization: async (characterId: string, prompt: string): Promise<GenerateVisResult> => {
    return robustFetch<GenerateVisResult>(API_ENDPOINTS.generateCharacterVisualization, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, prompt })
    });
  },
};
