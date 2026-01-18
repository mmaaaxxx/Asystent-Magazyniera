
import { GoogleGenAI, Type } from "@google/genai";

// Guideline: Always use `const ai = new GoogleGenAI({apiKey: process.env.API_KEY});`.
// Recommended: Create a new GoogleGenAI instance right before making an API call.

export const analyzeWarehouseImage = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    // Guideline: The .text property directly returns the string output.
    return response.text;
  } catch (error) {
    console.error("Gemini Image Analysis failed:", error);
    return "Nie udało się przeanalizować obrazu.";
  }
};

export const generateStockSummary = async (orders: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Na podstawie poniższej listy zgłoszeń przygotuj krótkie, punktowe podsumowanie stanu magazynowego i priorytetów na dzisiaj:\n${JSON.stringify(orders)}`,
      config: {
        // Guideline: If latency is more important, you can disable thinking by setting thinkingBudget to 0.
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Summary failed:", error);
    return "Błąd generowania podsumowania.";
  }
};
