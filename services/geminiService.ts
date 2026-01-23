
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserPreferences, MealPlanResponse, GroundingSource, GroceryStore, Meal, DayPlan, CalendarEvent } from "../types";

export const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const identificationCache = new Map<string, string[]>();

export const identifyIngredients = async (base64Image: string): Promise<string[]> => {
  const cacheKey = base64Image.substring(0, 50);
  if (identificationCache.has(cacheKey)) return identificationCache.get(cacheKey)!;

  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: "image/jpeg" } },
          { text: "List specific ingredients in this image, comma separated. Only names." }
        ] 
      }
    });
    const result = response.text?.split(',').map(i => i.trim()).filter(Boolean) || [];
    identificationCache.set(cacheKey, result);
    return result;
  } catch { return []; }
};

const getUserLocation = (): Promise<GeolocationPosition | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 3000 });
  });
};

const validateAndTransformResponse = (raw: any): MealPlanResponse => {
  const ensureArray = <T>(val: any): T[] => Array.isArray(val) ? val : (val ? [val] : []);

  return {
    ...raw,
    days: ensureArray<DayPlan>(raw.days).map(day => ({
      ...day,
      meals: ensureArray<Meal>(day.meals),
      prepReminders: ensureArray<string>(day.prepReminders)
    })),
    groceryList: ensureArray<any>(raw.groceryList).map(cat => ({
      ...cat,
      items: ensureArray<string>(cat.items)
    })),
    calendarEvents: ensureArray<CalendarEvent>(raw.calendarEvents).map(event => ({
      ...event,
      alternativeSlots: ensureArray<any>(event.alternativeSlots)
    }))
  };
};

export const generateMealPlan = async (prefs: UserPreferences): Promise<MealPlanResponse> => {
  const ai = getAI();
  const location = await getUserLocation();

  const systemInstruction = `You are a precision culinary logistics engine.
    MANDATORY: Return ONLY a raw JSON object. NO Markdown, NO text, NO explanation.
    SCHEMA RULES:
    1. "days" is an ARRAY of objects.
    2. Each day object has "meals", which is a FLAT ARRAY of Meal objects.
    3. "calendarEvents" is an ARRAY.
    4. Every cooking event MUST have "alternativeSlots" (ARRAY of {label, start, end}).
    
    JSON STRUCTURE:
    {
      "planTitle": "string",
      "days": [{"dayNumber": number, "meals": [...], "prepReminders": ["..."]}],
      "groceryList": [...],
      "totalEstimatedCost": number,
      "budgetStatus": "string",
      "fitnessNote": "string",
      "calendarEvents": [...]
    }`;

  const toolConfig = location ? {
    retrievalConfig: { latLng: { latitude: location.coords.latitude, longitude: location.coords.longitude } }
  } : undefined;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Plan a ${prefs.days}-day ${prefs.dietType} cycle. Budget ₹${prefs.dailyBudget}/day. City: ${prefs.cityType}.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig,
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Synthesis Failed: Missing data.");
    
    const rawData = JSON.parse(jsonMatch[0]);
    const parsed = validateAndTransformResponse(rawData);

    const meta = response.candidates?.[0]?.groundingMetadata;
    const sources: GroundingSource[] = [];
    const stores: GroceryStore[] = [];

    meta?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web) sources.push({ title: chunk.web.title, uri: chunk.web.uri, type: 'web' });
      if (chunk.maps) {
        sources.push({ title: chunk.maps.title, uri: chunk.maps.uri, type: 'maps' });
        stores.push({ name: chunk.maps.title, uri: chunk.maps.uri });
      }
    });

    parsed.groundingSources = sources;
    parsed.nearbyStores = stores;
    return parsed;
  } catch (error) {
    throw new Error(`Synthesis Failed: ${(error as Error).message}`);
  }
};

export const chatWithChef = async (messages: any[], currentPrefs: UserPreferences) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages,
    config: { systemInstruction: `You are the Culinary Muse Chef. Helping a ${currentPrefs.persona.type}.` }
  });
  return response.text;
};

// --- Audio Encoding & Decoding Helpers ---

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const synthesizeSpeech = async (text: string): Promise<void> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch (err) { console.error("TTS Fault:", err); }
};
