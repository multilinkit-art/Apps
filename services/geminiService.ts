
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeUrl = async (url: string): Promise<GeminiAnalysisResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this URL: ${url}. Provide 3 creative, short, catchy alphanumeric aliases (max 10 chars each) and a brief 1-sentence summary of what the link is likely about. Return only valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  alias: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["alias", "description"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["suggestions", "summary"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as GeminiAnalysisResponse;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      suggestions: [
        { alias: "link1", description: "Standard alias" },
        { alias: "cool-url", description: "Catchy alias" },
        { alias: "go-now", description: "Action alias" }
      ],
      summary: "A web link shared via Short.gy"
    };
  }
};
