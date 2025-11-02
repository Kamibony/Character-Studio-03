import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { VertexAI } from "@google-cloud/vertexai";
// Fix: Explicitly import Buffer to resolve TypeScript errors about missing Node.js types.
import { Buffer } from "buffer";

// --- Typy ---
type CharacterStatus = "ready" | "error";
interface UserCharacter {
  id: string;
  userId: string;
  characterName: string;
  status: CharacterStatus;
  createdAt: admin.firestore.Timestamp;
  description: string;
  keywords: string[];
  imagePreviewUrl: string; // GCS Cesta
  adapterId: string | null;
}

// --- Inicializácia ---
admin.initializeApp();
const db = admin.firestore();
const PROJECT_ID = "character-studio-comics";
const LOCATION = "us-central1";
const STORAGE_BUCKET = "character-studio-comics.appspot.com";
const regionalFunctions = functions.region(LOCATION);

// Helper na MIME typ
function getMimeType(filePath: string): string {
  if (filePath.toLowerCase().endsWith(".png")) return "image/png";
  if (filePath.toLowerCase().endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

// --- Funkcia 1: Získanie Knižnice Postáv ---
export const getCharacterLibrary = regionalFunctions.https.onCall(
  async (data, context): Promise<UserCharacter[]> => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Musíte byť prihlásený.");
      }
      const uid = context.auth.uid;
      const snapshot = await db
        .collection("user_characters")
        .where("userId", "==", uid)
        .get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as UserCharacter));
    } catch (error: any) {
      console.error("Error in getCharacterLibrary:", error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError("internal", "Nepodarilo sa načítať knižnicu postáv.");
    }
  }
);

// --- Funkcia 2: Vytvorenie Profilu Postavy ---
export const createCharacterProfile = regionalFunctions.runWith({timeoutSeconds: 120, memory: '1GB'}).https.onCall(
  async (data, context): Promise<UserCharacter> => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Musíte byť prihlásený.");
      }
      const uid = context.auth.uid;
      const { imageBase64, fileName } = data;

      if (!imageBase64 || !fileName) {
        throw new functions.https.HttpsError("invalid-argument", "Chýbajú dáta obrázku (imageBase64 alebo fileName).");
      }

      const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
      const storage = getStorage();
      const bucket = storage.bucket(STORAGE_BUCKET);
      
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const gcsPath = `user_uploads/${uid}/${Date.now()}_${fileName}`;
      const file = bucket.file(gcsPath);
      
      await file.save(imageBuffer, {
          metadata: { contentType: getMimeType(fileName) },
      });
      
      const textPart = { text: `Analyzuj postavu na tomto obrázku. Vygeneruj JSON objekt s: 'characterName' (kreatívne meno postavy), 'description' (krátky, pútavý popis) a 'keywords' (pole 5 relevantných kľúčových slov). Odpovedaj IBA ako validný JSON.` };
      const imagePart = { inlineData: { mimeType: getMimeType(fileName), data: imageBase64 } };
      
      const generativeModel = vertexAI.getGenerativeModel({
          model: "gemini-1.5-flash-001", 
          generationConfig: { responseMimeType: "application/json" }
      });
      
      const result = await generativeModel.generateContent({ contents: [{ role: 'user', parts: [textPart, imagePart] }] });
      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      let aiData = { characterName: "Hrdina (fallback)", description: "Popis zlyhal.", keywords: ["error"] };
      if (responseText) {
        try {
          aiData = JSON.parse(responseText);
        } catch (e) { console.warn("Nepodarilo sa parsovať AI JSON, použije sa fallback.", e); }
      } else {
        throw new functions.https.HttpsError("internal", "AI analýza nevrátila žiadne dáta.");
      }
      
      const newCharRef = db.collection("user_characters").doc();
      const newCharacter: UserCharacter = {
        id: newCharRef.id,
        userId: uid,
        status: "ready",
        createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        adapterId: `simulated-adapter-${Date.now()}`,
        imagePreviewUrl: gcsPath,
        ...aiData
      };
      
      await newCharRef.set(newCharacter);
      return newCharacter;

    } catch (error: any)
    {
      console.error("Error in createCharacterProfile:", error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError("internal", "Nepodarilo sa vytvoriť profil postavy.", error.message);
    }
  }
);

// --- Funkcia 3: Generovanie Obrázku ---
export const generateCharacterVisualization = regionalFunctions.runWith({timeoutSeconds: 120, memory: '1GB'}).https.onCall(
  async (data, context): Promise<{ base64Image: string }> => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Musíte byť prihlásený.");
      }
      
      const { characterId, prompt } = data;
      if (!characterId || !prompt) {
        throw new functions.https.HttpsError("invalid-argument", "Chýba 'characterId' alebo 'prompt'.");
      }
      
      const charDoc = await db.collection("user_characters").doc(characterId).get();
      if (!charDoc.exists) {
          throw new functions.https.HttpsError("not-found", "Postava neexistuje.");
      }
      const character = charDoc.data() as UserCharacter;

      const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

      // DEFINITIVE FIX: Use the correct model for image generation in Vertex AI.
      const generativeModel = vertexAI.getGenerativeModel({ model: "imagegeneration@006" });
      
      // Combine character description and user prompt into a single, rich text prompt.
      const generationPrompt = `Vytvor obrázok postavy. Vzhľad postavy: "${character.description}". Umiestni túto postavu do scény: "${prompt}".`;
      
      const textPart = { text: generationPrompt };

      // Call the image generation model
      const result = await generativeModel.generateContent({
          contents: [{ role: 'user', parts: [textPart] }],
      });
      
      const candidate = result.response.candidates?.[0];
      if (!candidate) throw new functions.https.HttpsError("internal", "AI model nevrátil žiadnych kandidátov.");
      if (candidate.finishReason && ['SAFETY', 'RECITATION'].includes(candidate.finishReason)) {
          throw new functions.https.HttpsError("invalid-argument", `Prompt bol zablokovaný z bezpečnostných dôvodov (${candidate.finishReason}).`);
      }
      
      // The image is expected in the first part of the content
      const imagePart = candidate.content?.parts?.find(part => part.inlineData);
      const imageBase64 = imagePart?.inlineData?.data;

      if (!imageBase64) {
          throw new functions.https.HttpsError("internal", "AI nevygenerovalo obrázok. Skúste zmeniť prompt alebo to skúste znova.");
      }
      
      return { base64Image: imageBase64 };

    } catch (error: any) {
        console.error("Kritická chyba v generateCharacterVisualization:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Neočakávaná chyba servera pri generovaní obrázku.", error.message);
    }
  }
);
