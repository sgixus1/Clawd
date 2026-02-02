import { GoogleGenAI, Type } from "@google/genai";

/**
 * AI Services for Construction Workspace
 * Uses Google Gemini API via @google/genai SDK
 */

/**
 * Generates quotation items based on a user-provided work description.
 * Returns an array of objects matching the Item interface (without ID).
 */
export const generateItemsFromDescription = async (description: string) => {
  // Use gemini-3-flash-preview for text tasks
  // Always use new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this construction work description and generate a list of line items for a quotation. Provide estimated unit prices in SGD, units, categories, and short codes. Description: ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING, description: "Short alphanumeric code for the item" },
              category: { type: Type.STRING, description: "Work category (e.g. PRELIMINARIES, STRUCTURAL, ARCHITECTURAL)" },
              description: { type: Type.STRING, description: "Detailed description of the task or material" },
              unit: { type: Type.STRING, description: "Unit of measurement (e.g. Ls, sqft, m2, Nos)" },
              unitPrice: { type: Type.NUMBER, description: "Estimated unit price in SGD" },
            },
            required: ["code", "category", "description", "unit", "unitPrice"],
          },
        },
      },
    });

    // Access the text property directly on the response object
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("AI Item Generation Error:", error);
    return [];
  }
};

/**
 * Provides guidance on Singapore Ministry of Manpower (MOM) regulations.
 */
export const askMomGuide = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: "You are an expert on Singapore Ministry of Manpower (MOM) labor laws and regulations. Provide concise, accurate guidance for construction employers. Cite specific MOM rules where applicable.",
      },
    });
    // Access the text property directly on the response object
    return response.text || "No guidance received from AI.";
  } catch (error) {
    console.error("MOM Guide Error:", error);
    return "Error connecting to AI advisor.";
  }
};

/**
 * Generates a project status report summary.
 */
export const generateProjectReport = async (projectData: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional project progress summary based on this data: ${JSON.stringify(projectData)}`,
    });
    // Access the text property directly on the response object
    return response.text || "";
  } catch (error) {
    console.error("Project Report Error:", error);
    return "";
  }
};

/**
 * Generates insights based on payroll data.
 */
export const generatePayrollInsight = async (payrollData: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these payroll records and provide insights on labor cost efficiency and trends: ${JSON.stringify(payrollData)}`,
    });
    // Access the text property directly on the response object
    return response.text || "";
  } catch (error) {
    console.error("Payroll Insight Error:", error);
    return "";
  }
};
