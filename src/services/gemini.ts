import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PatientReport, Urgency } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeSymptoms(report: Partial<PatientReport>) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Analyze the following patient symptoms and provide a preliminary diagnostic suggestion.
    Patient: ${report.patientName}, Age: ${report.age}, Gender: ${report.gender}
    Symptoms: ${report.symptoms?.join(", ")}
    Description: ${report.description}

    Provide the response in the following JSON format:
    {
      "possibleConditions": ["condition1", "condition2"],
      "urgency": "low" | "medium" | "high" | "critical",
      "recommendation": "Short recommendation for the CHV"
    }
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          possibleConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
          urgency: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          recommendation: { type: Type.STRING }
        },
        required: ["possibleConditions", "urgency", "recommendation"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function detectMalnutrition(base64Image: string) {
  const model = "gemini-2.5-flash-image";
  const prompt = `
    Analyze this image of a child for signs of malnutrition. 
    Look for visible signs like wasting, edema, or MUAC measurement if visible.
    Provide a status assessment.

    Provide the response in the following JSON format:
    {
      "status": "normal" | "at_risk" | "severe",
      "confidence": 0.0 to 1.0,
      "notes": "Brief explanation of the findings"
    }
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { data: base64Image.split(",")[1], mimeType: "image/jpeg" } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ["normal", "at_risk", "severe"] },
          confidence: { type: Type.NUMBER },
          notes: { type: Type.STRING }
        },
        required: ["status", "confidence", "notes"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzeOutbreak(reports: PatientReport[]) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Analyze the following patient reports from a specific district to identify potential disease outbreaks.
    Reports: ${JSON.stringify(reports.map(r => ({ symptoms: r.symptoms, location: r.location })))}

    If an outbreak is detected, provide an alert.
    Provide the response in the following JSON format:
    {
      "isOutbreak": boolean,
      "condition": "Name of the potential disease",
      "severity": "low" | "medium" | "high" | "critical",
      "analysis": "Detailed explanation of why this is considered an outbreak"
    }
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isOutbreak: { type: Type.BOOLEAN },
          condition: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          analysis: { type: Type.STRING }
        },
        required: ["isOutbreak", "condition", "severity", "analysis"]
      }
    }
  });

  return JSON.parse(response.text);
}
