
import { Timestamp } from 'firebase/firestore';

export type CharacterStatus = 'ready' | 'error';

export interface UserCharacter {
  id: string;
  userId: string;
  characterName: string;
  status: CharacterStatus;
  createdAt: Timestamp;
  description: string;
  keywords: string[];
  imagePreviewUrl: string; // GCS Path
  adapterId: string | null;
  // This will be added on the client-side after fetching from storage
  publicImagePreviewUrl?: string;
}
