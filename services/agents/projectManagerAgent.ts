import { GoogleGenAI } from "@google/genai";
import { ProjectData } from "../../types";

export const generateProjectPlan = async (data: ProjectData): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  // Always create a new instance to ensure fresh config/keys if needed
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    ROLE: You are an expert Senior Project Manager at Renovivo.
    TASK: Create a detailed, professional Project Execution Roadmap based on the accepted offer.
    
    PROJECT CONTEXT:
    - Type: ${data.type}
    - Area: ${data.totalArea} m2
    - Location: ${data.location}
    - Current State: ${data.condition}
    - Scope of Work: ${data.selectedServices.map(s => s.name).join(', ')}
    - Constraints/Notes: ${data.notes}
    
    INSTRUCTIONS:
    1. Analyze the dependencies between tasks (e.g., flooring cannot be done before wet processes dry).
    2. Structure the plan into logical Phases (Preparation, Demolition, Installations, Finishing, Handover).
    3. For each phase, estimate duration in days and identify critical resources needed early.
    4. Perform a Risk Assessment specific to this property type (e.g., old brick vs new build).
    5. Language: Bulgarian.
    
    OUTPUT FORMAT:
    
    ### 📅 График на изпълнение
    | Фаза | Дейност | Срок | Зависимости |
    | :--- | :--- | :--- | :--- |
    | ... | ... | ... | ... |
    
    ### 📦 Логистика и Ресурси (Седмица 1)
    * [List of materials/tools needed immediately]
    
    ### ⚠️ Анализ на Риска
    * **[Risk Name]:** [Mitigation Strategy]
    
    THINKING PROCESS:
    - Consider drying times for screeds/plasters.
    - Account for sequential vs parallel tasks.
    - Factor in specific property constraints.
  `;

  // Using gemini-3-pro-preview with MAX thinking budget (32k) for complex reasoning
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
        thinkingConfig: { thinkingBudget: 32768 },
    }
  });

  return response.text || "Неуспешно генериране на план.";
};