
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PlayerStats, Weather } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getNarrativeResponse = async (
  action: string,
  location: string,
  stats: PlayerStats,
  inventory: string[],
  weather: Weather
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Player Action: "${action}" in the location "${location}". 
      Current Weather: ${weather.type} (${weather.description}).
      Player Stats: Warmth ${stats.warmth}%, Energy ${stats.energy}%, Health ${stats.health}%, Hunger ${stats.hunger}%. 
      Inventory: ${inventory.join(', ') || 'Empty'}.
      
      Narrate the outcome of this action in a gritty, atmospheric Ice Age setting. 
      Incorporate the current weather into the narrative (e.g., if it's a Blizzard, emphasize the blinding snow).
      Keep it brief (2-3 sentences). Focus on nature, survival, and the cold. 
      Mention if stats change based on the environment and action.`,
      config: {
        systemInstruction: "You are an atmospheric game master for an Ice Age survival RPG. Your tone is serious, immersive, and descriptive of a harsh prehistoric world.",
        temperature: 0.8,
      },
    });
    return response.text || "The wind howls, and the ice crackles beneath your feet, but nothing else happens.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The bitter cold freezes your thoughts. (Check your API Key or connection)";
  }
};

export const generateSceneImage = async (location: string, description: string, weather: Weather): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `High-quality cinematic wide-angle shot of a prehistoric Ice Age setting: ${location}. Weather: ${weather.type}. ${description}. Realistic lighting, snow particles, deep blues and whites, prehistoric flora. Digital art style.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};
