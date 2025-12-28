import { GoogleGenAI } from "@google/genai";
import { ProjectData } from "../../types";

export const generateSalesFollowUp = async (
  data: ProjectData, 
  daysSinceOffer: 3 | 7 | 14
): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Define strict templates to ensure brand consistency
  let templateObj = {
    goal: "",
    text: ""
  };

  if (daysSinceOffer === 3) {
    templateObj = {
      goal: "Helpful check-in (Day 3)",
      text: "Здравейте [Client Name], успяхте ли да разгледате офертата за обекта в [Location]? На разположение сме, ако имате въпроси относно бюджета или етапите на работа."
    };
  } else if (daysSinceOffer === 7) {
    templateObj = {
      goal: "Value & Schedule (Day 7)",
      text: "Здравейте [Client Name], в Renovivo ценим прозрачността и доброто планиране. Подготвяме графика за следващия месец – моля, споделете дали продължаваме с проекта в [Location], за да предвидим ресурс."
    };
  } else {
    templateObj = {
      goal: "Closing file (Day 14)",
      text: "Здравейте [Client Name], тъй като нямаме обратна връзка, ще архивираме текущата оферта за [Location]. Оставеме на разположение, ако решите да подновите разговора на по-късен етап."
    };
  }

  const prompt = `
    CONTEXT: 
    Client Name: ${data.client.name}
    Location: ${data.location}
    Project Type: ${data.type}

    TASK: 
    Generate a follow-up message based STRICTLY on the provided template below. 
    1. Replace [Client Name] with the actual name (use first name only if full name is provided, e.g. "Ivan" instead of "Ivan Ivanov").
    2. Replace [Location] with the specific location from context.
    3. Ensure grammar is correct in Bulgarian.
    
    TEMPLATE:
    "${templateObj.text}"
    
    INSTRUCTIONS:
    - Do NOT change the core message or tone.
    - Do NOT add subject lines.
    - Sign as "Екипът на Renovivo" at the end.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { temperature: 0.2 } // Lower temperature for adherence to template
  });

  return response.text || "Неуспешно генериране на съобщение.";
};