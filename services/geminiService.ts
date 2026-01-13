
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeWarehouseImage = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze this warehouse shelf. Identify product references, estimated quantities, and any visible damage. Return the result in a professional warehouse report format." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Image Analysis failed:", error);
    return "Nie udało się przeanalizować obrazu.";
  }
};

export const generateStockSummary = async (orders: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Na podstawie poniższej listy zgłoszeń przygotuj krótkie, punktowe podsumowanie stanu magazynowego i priorytetów na dzisiaj:\n${JSON.stringify(orders)}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Summary failed:", error);
    return "Błąd generowania podsumowania.";
  }
};
