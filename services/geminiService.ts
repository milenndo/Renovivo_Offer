
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectData, RenovationLevel, AnalyzedData, Zone } from "../types";

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to calculate estimates
export const calculateEstimates = (data: ProjectData) => {
  const level = data.level || RenovationLevel.STANDARD;
  
  // Calculate Grand Total from Selected Services
  let markup = 0;
  if (level === RenovationLevel.HIGH_END) markup = 0.20;
  if (level === RenovationLevel.PREMIUM) markup = 0.30;

  const totalBGN = data.selectedServices.reduce((sum, service) => {
    const unitPrice = service.basePriceBGN * (1 + markup);
    return sum + (unitPrice * service.quantity);
  }, 0);

  const totalEUR = totalBGN / 1.95583;

  const bathrooms = data.zones.filter(z => 
    z.name.toLowerCase().includes('баня') || 
    z.name.toLowerCase().includes('wc') || 
    z.name.toLowerCase().includes('тоалетна')
  );
  
  return {
    totalRange: `${totalBGN.toLocaleString('bg-BG', {maximumFractionDigits: 0})} лв. (без ДДС)`,
    totalEUR: `€${totalEUR.toLocaleString('bg-BG', {maximumFractionDigits: 0})}`,
    hasDetailedEstimate: data.selectedServices.length > 0,
    servicesCount: data.selectedServices.length,
    bathroomsCount: bathrooms.length,
  };
};

const SYSTEM_INSTRUCTION = `
Действай като Renovivo AI. Генерирай ясна, минималистична оферта за ремонт.
Без увод и заключение. Използвай само следните секции, разделени с нови редове:

## РЕЗЮМЕ
[Кратко, делово описание на проекта в 2 изречения]

## БЮДЖЕТНА РАМКА
[Използвай ТОЧНО подадената сума от калкулацията. Посочи изрично, че е без ДДС и включва описаните услуги.]

## ДЕТАЙЛНА СПЕЦИФИКАЦИЯ
[Изброй избраните услуги с техните количества и единични цени, форматирани като списък или кратка таблица]

## ИЗКЛЮЧЕНИЯ
[Какво НЕ е включено: чистови настилки, мебели, уреди, ДДС]

## СРОКОВЕ И ЕТАПИ
[Ориентировъчен срок и стъпки: Оглед -> Договор -> Изпълнение]

## СЛЕДВАЩИ СТЪПКИ
[Призив за оглед]

Тон: Спокоен, уверен, без епитети.
`;

export const generateRenovationOffer = async (data: ProjectData): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const estimates = calculateEstimates(data);

  let markup = 0;
  if (data.level === RenovationLevel.HIGH_END) markup = 0.20;
  if (data.level === RenovationLevel.PREMIUM) markup = 0.30;

  const servicesList = data.selectedServices.map(s => {
    const price = s.basePriceBGN * (1 + markup);
    return `- ${s.name}: ${s.quantity} ${s.unit} x ${price.toFixed(2)} лв.`;
  }).join('\n');

  const zoneDetails = data.zones.map(z => 
    `${z.name}: ${z.area}м2 под, ${z.height}м височина (${z.wallArea}м2 стени)`
  ).join('\n');

  const prompt = `
КЛИЕНТ: ${data.client.name}

ПРОЕКТ:
Тип: ${data.type} ${data.yearOfConstruction ? `(Строителство: ${data.yearOfConstruction})` : ''}
Площ: ${data.totalArea}м2, ${data.location}
Зони и Детайли:
${zoneDetails}

Ниво: ${data.level}
Инфо: ${data.notes}

ИЗБРАНИ УСЛУГИ И ЦЕНИ (ТОЗИ СПИСЪК Е ФИНАЛЕН):
${servicesList}

ФИНАЛНА КАЛКУЛАЦИЯ:
Общо: ${estimates.totalRange} / ${estimates.totalEUR}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, 
      },
    });

    return response.text || "Неуспешно генериране.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Възникна технически проблем. Моля, опитайте отново.");
  }
};

// --- ANALYZE FILE ---
export const analyzeProjectFile = async (file: File): Promise<AnalyzedData> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(file);

  const prompt = `
    Analyze this image (floor plan, architectural drawing, or sketch).
    Extract:
    1. The total area (if mentioned or estimate based on rooms).
    2. A list of rooms/zones with their approximate areas in square meters.
    3. The likely property type (Apartment, House, Office).
    
    Return JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalArea: { type: Type.NUMBER },
            zones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  area: { type: Type.NUMBER },
                }
              }
            },
            propertyTypeHint: { type: Type.STRING },
            suggestion: { type: Type.STRING, description: "A brief observation about the layout" }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Auto-calculate derived areas for analyzed zones
    const zonesWithDetails = (result.zones || []).map((z: any, idx: number) => {
        const area = z.area || 0;
        const height = 2.60;
        const perimeter = 4 * Math.sqrt(area);
        return {
            id: `auto-${idx}`,
            name: z.name || 'Помещение',
            area: area,
            height: height,
            ceilingArea: area,
            wallArea: parseFloat((perimeter * height).toFixed(2))
        };
    });

    return {
      totalArea: result.totalArea || 0,
      zones: zonesWithDetails,
      suggestion: result.suggestion || "Данни, извлечени от изображението."
    };

  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Неуспешен анализ на файла.");
  }
};

// --- NEW: GENERATE 3D VISUALIZATION WITH FALLBACK ---
export const generateRoomVisualization = async (roomName: string, style: string = "Modern Minimalist"): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Photorealistic 3D architectural render of a ${roomName}.
    Style: ${style}. 
    High quality, interior design magazine look, renovations completed.
    Neutral colors, warm lighting.
  `;

  try {
    // 1. Try Premium Model First (Gemini 3 Pro)
    // This supports imageSize '1K' and requires a paid billing project key.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error: any) {
    // 2. Fallback to Standard Model (Gemini 2.5 Flash) on Permission Error
    // This model works with free tier keys. It does not support 'imageSize', so we remove it from config.
    const isPermissionError = error.toString().includes('403') || error.message?.includes('Permission denied') || error.toString().includes('Permission denied');
    
    if (isPermissionError) {
        console.warn("Gemini 3 Pro Image failed (Permission Denied). Falling back to Gemini 2.5 Flash Image.");
        try {
            const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: prompt }]
                },
                config: {
                    imageConfig: {
                        aspectRatio: "16:9"
                    }
                }
            });

            for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        } catch (fallbackError) {
            console.error("Fallback failed:", fallbackError);
            // Throw original error to trigger UI key selection flow which is clearer for the user
            throw error;
        }
    }

    // Propagate other errors (e.g. rate limit, server error)
    console.error("Vis Error:", error);
    throw error;
  }
  
  throw new Error("No image generated");
};
