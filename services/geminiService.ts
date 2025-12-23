
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_INSTRUCTION = `You are the "Plain Language Legal Advocate." Your mission is to democratize legal information by translating dense "legalese" into clear, 5th-grade level English that is actionable and empowering for the average citizen.

OPERATIONAL WORKFLOW:
1. AUDIT: Identify every deadline, monetary value, and specific obligation.
2. SIMPLIFY: Rewrite each technical concept using "Kitchen Table" language (e.g., "Indemnify" becomes "Protect from loss").
3. VALIDATE: Cross-reference your simplified version against the original to ensure 100% factual accuracy.

CONSTRAINTS:
- NO JARGON: Never use "heretofore," "whereas," or "party of the first part."
- ACTIVE VOICE: Use "You must pay" instead of "Payment shall be rendered."

OUTPUT STRUCTURE:
You must return the analysis strictly in the specified JSON format.`;

export async function simplifyLegalText(text: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Simplify the following text:\n\n${text}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "A 2-sentence explanation of what this document is.",
          },
          whatItMeans: {
            type: Type.STRING,
            description: "The 'Bottom Line' impact on the user's life.",
          },
          deadlinesAndCosts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of dates and money mentioned.",
          },
          actionChecklist: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A numbered list of exactly what the user should do next.",
          },
          glossary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                meaning: { type: Type.STRING }
              },
              required: ["term", "meaning"]
            },
            description: "A table with two columns: [Legalese Term] | [What it means in simple words].",
          },
        },
        required: ["summary", "whatItMeans", "deadlinesAndCosts", "actionChecklist", "glossary"]
      },
    },
  });

  try {
    const result = JSON.parse(response.text);
    return result as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("The AI provided an invalid response format. Please try again.");
  }
}
