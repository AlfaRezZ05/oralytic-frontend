
import { GoogleGenAI, Type } from "@google/genai";
import type { OralAnalysisResult, HealthReportData, PatientData, StuntingScreeningData } from '../types';
import { getKnowledgeBasePrompt } from '../data/knowledgeBase';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  if (typeof window !== 'undefined' && file.type.startsWith('image/')) {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        img.onload = () => {
          const maxDim = 1280;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressed.split(',')[1]);
          } else {
            resolve((img.src as string).split(',')[1]);
          }
        };
        img.onerror = () => {
          const r2 = new FileReader();
          r2.onloadend = () => resolve((r2.result as string).split(',')[1]);
          r2.readAsDataURL(file);
        };
        reader.readAsDataURL(file);
      });
      return { inlineData: { data: base64, mimeType: 'image/jpeg' } };
    } catch {
      // Fallback if compression fails
    }
  }

  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: base64, mimeType: file.type } };
};

const oralAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        issues: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    diseaseName: {
                        type: Type.STRING,
                        enum: [
                            'K02.51 Dental caries on pit and fissure surface, limited to enamel',
                            'K02.52 Dental caries on pit and fissure surface penetrating into dentin',
                            'K05.0 Acute gingivitis',
                            'K00.4 Enamel hypoplasia',
                            'K07.3 Anomalies of tooth position (Crowding)',
                            'TP.01 TriPlaque: New Plaque (<48h)',
                            'TP.02 TriPlaque: Old Plaque (>48h)',
                            'TP.03 TriPlaque: Acidic Plaque (High Risk)'
                        ]
                    },
                    description: { type: Type.STRING },
                    boundingBox: {
                        type: Type.OBJECT,
                        properties: {
                            x: { type: Type.NUMBER, description: "X coordinate (0-100) from top-left" },
                            y: { type: Type.NUMBER, description: "Y coordinate (0-100) from top-left" },
                            width: { type: Type.NUMBER, description: "Width as % of image width" },
                            height: { type: Type.NUMBER, description: "Height as % of image height" },
                        },
                        required: ["x", "y", "width", "height"]
                    }
                },
                required: ["diseaseName", "description", "boundingBox"]
            }
        },
        hygieneAssessment: { type: Type.STRING, enum: ['Good', 'Fair', 'Poor'] }
    },
    required: ["issues", "hygieneAssessment"]
};

export const analyzeOralImageWithBoundingBox = async (imageFile: File, ageInYears: number): Promise<OralAnalysisResult> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const knowledgeBase = getKnowledgeBasePrompt();
    
    const prompt = `PRECISION TASK: Analyze this oral photo for TriPlaque and ICD-10 issues.
    
    COORDINATE RULES:
    - Use a 0-100 scale for x, y, width, height.
    - [0,0] is the top-left of the IMAGE. [100,100] is the bottom-right.
    - Ensure the bounding box TIGHTLY surrounds only the specific affected area (e.g., the specific tooth surface showing the plaque color).

    DETECTION FOCUS:
    1. TriPlaque PINK (TP.01): Mark areas with fresh pink stain.
    2. TriPlaque PURPLE/DARK BLUE (TP.02): Mark mature plaque at gum lines.
    3. TriPlaque LIGHT BLUE (TP.03): Mark acidic plaque areas.
    4. K00.4/K07.3: Mark enamel defects or crowding.

    KNOWLEDGE BASE:
    ${knowledgeBase}`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { 
            responseMimeType: "application/json", 
            responseSchema: oralAnalysisSchema,
            temperature: 0.1, // Lower temperature for higher coordinate precision
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    return JSON.parse(response.text?.trim() || '{}') as OralAnalysisResult;
};

export const checkImageQuality = async (imageFile: File) => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = "Analyze image quality for dental diagnosis. Respond JSON with quality: 'good'|'poor' and reason.";
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { 
            responseMimeType: "application/json", 
            responseSchema: {
                type: Type.OBJECT,
                properties: { quality: { type: Type.STRING }, reason: { type: Type.STRING } },
                required: ["quality", "reason"]
            },
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    return JSON.parse(response.text?.trim() || '{}');
};

export const generateFinalReport = async (
    patientData: PatientData,
    stuntingData: StuntingScreeningData,
    oralResults: { diseaseName: string }[][],
    metrics: Partial<HealthReportData>,
    language: 'en' | 'id'
): Promise<HealthReportData> => {
    const allOralIssues = oralResults.flat().map(o => o.diseaseName).join(', ');
    const prompt = `Act as an AI Pediatric Nutritionist. Correlate TriPlaque colors (Light Blue = High Cavity Risk) and ICD-10 findings to patient growth data. 
    Language: ${language}.
    Data: Patient ${patientData.name}, Oral Findings: ${allOralIssues}, Nutrition Metrics: ${JSON.stringify(metrics)}.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    nutritionResult: { type: Type.STRING },
                    nutritionReason: { type: Type.STRING },
                    oralResult: { type: Type.STRING },
                    oralReason: { type: Type.STRING },
                    conclusion: { type: Type.STRING },
                    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["nutritionResult", "nutritionReason", "oralResult", "oralReason", "conclusion", "recommendations"]
            },
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    return { ...metrics, ...JSON.parse(response.text?.trim() || '{}') } as HealthReportData;
};
