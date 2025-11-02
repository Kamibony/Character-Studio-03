import { functions, httpsCallable, auth } from './firebase';
import type { UserCharacter } from '../types';

// Typy pre argumenty a návratové hodnoty
interface CreateProfileArgs { firstFilePath: string; }
interface GenerateVisArgs { characterId: string; prompt: string; }
interface GenerateVisResult { base64Image: string; }

// --- Robustný wrapper, ktorý pridá autentifikáciu ---
async function callFirebaseFunction<T_Req, T_Res>(functionName: string, data: T_Req): Promise<T_Res> {
    if (!auth.currentUser) {
        throw new Error("Používateľ nie je prihlásený.");
    }

    // Vytvoríme callable funkciu
    const callableFunction = httpsCallable<T_Req, T_Res>(functions, functionName);

    // Funkcia httpsCallable automaticky spracuje token,
    // ak je používateľ prihlásený (auth.currentUser).

    try {
        const result = await callableFunction(data);
        return result.data;
    } catch (error: any) {
        console.error(`Chyba pri volaní funkcie ${functionName}:`, error);
        // Preposlanie zrozumiteľnej chybovej hlášky z backendu
        throw new Error(error.message || "Neznáma chyba servera.");
    }
}

// Objekt API, ktorý bude používať naša aplikácia
export const api = {
  getCharacterLibrary: async (): Promise<UserCharacter[]> => {
    // Pre funkcie bez argumentov posielame prázdny objekt alebo null
    return callFirebaseFunction('getCharacterLibrary', {});
  },

  createCharacterProfile: async (firstFilePath: string): Promise<UserCharacter> => {
     return callFirebaseFunction<CreateProfileArgs, UserCharacter>('createCharacterProfile', { firstFilePath });
  },

  generateCharacterVisualization: async (characterId: string, prompt: string): Promise<GenerateVisResult> => {
    return callFirebaseFunction<GenerateVisArgs, GenerateVisResult>('generateCharacterVisualization', { characterId, prompt });
  },
};