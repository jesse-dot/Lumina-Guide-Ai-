import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GroundingChunk, ItineraryItem } from "../types";

// Helper to clean base64 string
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

// Helper to decode audio
const decodeAudio = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Step 1: Identify the landmark using gemini-3-pro-preview
 */
export const identifyLandmark = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64(base64Image),
          },
        },
        {
          text: "Identify this landmark. Return ONLY the name of the landmark. If it is not a recognizable landmark, return 'Unknown Location'.",
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          landmarkName: { type: Type.STRING },
        },
        required: ['landmarkName'],
      },
    },
  });

  const jsonText = response.text || "{}";
  try {
    const data = JSON.parse(jsonText);
    return data.landmarkName || "Unknown Location";
  } catch (e) {
    console.error("Failed to parse identity", e);
    return "Unknown Location";
  }
};

/**
 * Step 2: Get history and details using gemini-2.5-flash with Google Search Grounding
 */
export const getLandmarkDetails = async (landmarkName: string): Promise<{ text: string; sources: GroundingChunk[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Note: responseMimeType is NOT set because we are using googleSearch
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Provide a engaging, tour-guide style summary of ${landmarkName}. Include 2-3 interesting historical facts. Keep it under 150 words.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "No details found.";
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  // Filter only web chunks and map to local GroundingChunk type
  const sources: GroundingChunk[] = chunks
    .filter((c: any) => c.web && c.web.uri && c.web.title)
    .map((c: any) => ({
      web: {
        uri: c.web.uri,
        title: c.web.title
      }
    }));

  return { text, sources };
};

/**
 * Step 3: Generate speech using gemini-2.5-flash-preview-tts
 */
export const generateNarration = async (text: string): Promise<ArrayBuffer | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: {
        parts: [{ text }],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return decodeAudio(base64Audio);
    }
    return null;
  } catch (e) {
    console.error("TTS generation failed", e);
    return null;
  }
};

/**
 * New Feature: Generate Personalized Itinerary
 */
export const generateItinerary = async (interests: string[]): Promise<ItineraryItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const interestStr = interests.join(", ");
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create a 1-day walking tour itinerary for a tourist interested in: ${interestStr}. Provide 4 distinct stops.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stopName: { type: Type.STRING },
            description: { type: Type.STRING },
            duration: { type: Type.STRING, description: "e.g. '1 hour'" }
          },
          required: ['stopName', 'description', 'duration']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Itinerary parse error", e);
    return [];
  }
};

/**
 * New Feature: Review User Contribution
 */
export const validateContribution = async (name: string, anecdote: string): Promise<{approved: boolean, feedback: string}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Review this user contribution for a travel app. Landmark: "${name}". Anecdote: "${anecdote}". Is this content appropriate (safe, non-toxic, relevant)?`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          approved: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING }
        },
        required: ['approved', 'feedback']
      }
    }
  });
  
   try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { approved: false, feedback: "Error parsing review." };
  }
};