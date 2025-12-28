import { GoogleGenAI } from "@google/genai";
import { CommunicationChannel } from "../../types";

export const adaptMessage = async (
  originalText: string,
  channel: CommunicationChannel
): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let instructions = "";
  switch(channel) {
    case CommunicationChannel.EMAIL:
      instructions = "Format as a clean, professional email. Add a subject line based on the content.";
      break;
    case CommunicationChannel.SMS:
      instructions = "Compress to strictly under 160 characters. Remove greetings if needed. Keep the core call to action.";
      break;
    case CommunicationChannel.WHATSAPP:
      instructions = "Make it conversational but professional. Use new lines for readability. Add 1 appropriate emoji. Keep it concise.";
      break;
  }

  const prompt = `
    TASK: Adapt the following text for ${channel}.
    ORIGINAL: "${originalText}"
    
    GUIDELINES:
    ${instructions}
    
    LANGUAGE: Bulgarian.
    OUTPUT: Only the adapted message text.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { temperature: 0.5 }
  });

  return response.text || "Неуспешна адаптация.";
};