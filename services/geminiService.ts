import { GoogleGenAI } from "@google/genai";
import { ProjectData, RenovationLevel } from "../types";

// 1. Pricing Configuration (Internal Logic)
// Prices are in BGN (Bŭlgarski lev)
const PRICING_CONFIG = {
  perSquareMeter: {
    [RenovationLevel.STANDARD]: { min: 300, max: 500 },
    [RenovationLevel.HIGH_END]: { min: 550, max: 850 },
    [RenovationLevel.LUXURY]: { min: 900, max: 1400 },
  },
  bathroom: { min: 3500, max: 8000 }, // Average cost for labor + rough materials per bathroom
  microcement: { min: 80, max: 150 }, // per m2
};

// 2. Calculation Helper - Exported for use in App.tsx history saving
export const calculateEstimates = (data: ProjectData) => {
  const level = data.level || RenovationLevel.STANDARD;
  
  // Select range based on level, fallback to Standard if undefined
  const range = PRICING_CONFIG.perSquareMeter[level] || PRICING_CONFIG.perSquareMeter[RenovationLevel.STANDARD];
  
  const totalMin = data.totalArea * range.min;
  const totalMax = data.totalArea * range.max;

  // Identify bathrooms for context
  const bathrooms = data.zones.filter(z => 
    z.name.toLowerCase().includes('баня') || 
    z.name.toLowerCase().includes('wc') || 
    z.name.toLowerCase().includes('тоалетна')
  );
  
  return {
    totalRange: `${totalMin.toLocaleString('bg-BG')} - ${totalMax.toLocaleString('bg-BG')} лв.`,
    pricePerSqm: `${range.min} - ${range.max} лв./м²`,
    bathroomsCount: bathrooms.length,
    bathroomPrice: `${PRICING_CONFIG.bathroom.min} - ${PRICING_CONFIG.bathroom.max} лв.`
  };
};

const SYSTEM_INSTRUCTION = `
Действай като Renovivo AI. Генерирай ясна, минималистична оферта за ремонт.
Без увод и заключение. Използвай само следните секции, разделени с нови редове:

## РЕЗЮМЕ
[Кратко, делово описание на проекта в 2 изречения]

## БЮДЖЕТНА РАМКА
[Използвай подадените калкулации. Посочи, че цената е за труд и груби материали.]

## ОБХВАТ НА ДЕЙНОСТИТЕ
[Списък с тирета, групирани логично]

## ИЗКЛЮЧЕНИЯ
[Какво НЕ е включено: чистови настилки, мебели, уреди]

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

  // Compact context for the AI
  const prompt = `
КЛИЕНТ: ${data.client.name}

ПРОЕКТ:
Тип: ${data.type}, ${data.totalArea}м2, ${data.location}
Зони: ${data.zones.map(z => `${z.name} (${z.area}м2)`).join(', ')}
Дейности: ${data.activities.join(', ')}
Ниво: ${data.level}
Инфо: ${data.notes}

КАЛКУЛАЦИЯ (ВКЛЮЧИ ТЕЗИ ЦИФРИ):
Общо: ${estimates.totalRange}
Цена/м2: ${estimates.pricePerSqm}
Бани: ${estimates.bathroomsCount} бр. (~${estimates.bathroomPrice}/бр)
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Low temperature for high precision and consistent formatting
      },
    });

    return response.text || "Неуспешно генериране.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Възникна технически проблем. Моля, опитайте отново.");
  }
};