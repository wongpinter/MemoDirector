import { GoogleGenAI, Type } from "@google/genai";
import { Suggestion, SUGGESTION_SCHEMA } from "../types";
import { getPhoneticsForNumber } from "../constants";

// Helper to get client with current key (important for Veo key switching)
const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
}

export const getPAOSuggestions = async (
  number: number,
  theme: string,
  specificPerson?: string,
  strictMode: boolean = false
): Promise<Suggestion[]> => {
  const ai = getAI();
  if (!ai) {
    throw new Error("Gemini API Key is missing. Please check metadata.json or env vars.");
  }

  const phonetics = getPhoneticsForNumber(number);
  const strNum = number.toString().padStart(2, '0');
  const d1 = strNum[0];
  const d2 = strNum[1];

  let prompt = "";

  // Shared phonetic instruction block
  const phoneticRules = `
      Phonetic Rules for Number ${strNum}:
      - The word must be constructed using the Major System sounds.
      - Digit 1 (${d1}): First consonant sound must be compatible.
      - Digit 2 (${d2}): Next consonant sound must be compatible.
      - Helper: ${phonetics}.
      - Vowels (a,e,i,o,u) and 'w','h','y' are ignored and can be used freely as fillers.
  `;

  if (specificPerson && specificPerson.trim().length > 0) {
    if (strictMode) {
       prompt = `
        I am building a Major System PAO memory list.
        Target Number: ${strNum}
        
        User Selected Character: "${specificPerson}"
        
        ${phoneticRules}

        Task: Suggest 5 Action and Object pairs for "${specificPerson}".
        
        STRICT CONSTRAINT (Strict Mode Active):
        1. The Action verb MUST phonetically decode to ${strNum}.
        2. The Object noun MUST phonetically decode to ${strNum}.
        3. Try to make the Action and Object somewhat relevant to "${specificPerson}" if possible, but PHONETIC FIT is the absolute priority.

        Output JSON Format:
        {
          "suggestions": [
            { "person": "${specificPerson}", "action": "Phonetic Action", "object": "Phonetic Object", "reasoning": "Action matches ${strNum} because... Object matches ${strNum} because..." }
          ]
        }
       `;
    } else {
      prompt = `
        I am building a Major System PAO memory list.
        The user has already selected a specific character.
        
        Character (Person): "${specificPerson}"
        
        Task: Suggest 5 distinct Action and Object pairs that are ICONIC to "${specificPerson}".
        
        Rules:
        1. The 'Person' field in the output MUST be exactly "${specificPerson}".
        2. The Action must be something this specific character is famous for doing.
        3. The Object must be a tool, weapon, or item they frequently use.
        4. Ignore phonetic rules for the Name (since the user provided it), but ensure the Action/Object helps visualize the character strongly.
        5. Ensure the Action and Object are thematically consistent with the character's universe.
        
        Output JSON Format per Schema.
      `;
    }
  } else {
      prompt = `
        I am building a Major System PAO (Person-Action-Object) memory list.
        Target Number: ${strNum}
        Theme: ${theme}
        
        ${phoneticRules}

        Task: Suggest 5 Person-Action-Object sets where the PERSON'S NAME phonetically matches ${strNum}.
        
        Rules:
        1. The Person's name MUST decode to ${strNum} based on Major System rules.
           - Example for 15 (T-L): "Ted Lasso", "Dalai Lama".
           - Example for 32 (M-N): "Moon Knight", "Mulan".
        2. The Action and Object should be iconic to that person (thematic connection).
           - Action/Object do NOT need to fit phonetic rules (unless strict mode is requested, but assume standard mode here).
           - They must be highly visual.

        Output JSON Format per Schema.
      `;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: SUGGESTION_SCHEMA
    }
  });
  
  if (!response.text) return [];

  try {
      const parsed = JSON.parse(response.text);
      return parsed.suggestions || [];
  } catch (e) {
      console.error("JSON Parse error", e);
      return [];
  }
};

export const getSceneDescription = async (person: string, action: string, object: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return `${person} is ${action} with ${object}.`;

    const prompt = `
        Write a vivid, memorable, one-sentence scene description for a memory palace.
        
        Characters: ${person}
        Action: ${action}
        Object: ${object}
        
        The scene should be absurd, funny, or striking to make it easy to remember. 
        Keep it under 20 words. 
        Focus on visual details, colors, and sounds.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text?.trim() || `${person} is ${action} with ${object}.`;
}

export const generateMemoryImage = async (sceneDescription: string): Promise<string> => {
  const ai = getAI();
  if (!ai) throw new Error("AI not initialized");
  
  const prompt = `Generate an image of: ${sceneDescription}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
  }
  
  // Handle text refusal if present
  const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
  if (textPart) {
      console.warn("Image Generation - Text returned:", textPart);
      throw new Error(`Model refused to generate image: ${textPart}`);
  }
  
  console.warn("Generative Error: Model response did not contain inline image data.", response);
  throw new Error("No image data generated. The model may have filtered the request due to safety settings.");
};

export const generateMemoryVideo = async (sceneDescription: string): Promise<{blob: Blob, mimeType: string}> => {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");

    // Veo model requires paid key
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: sceneDescription,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned");

    const apiKey = process.env.API_KEY;
    const response = await fetch(`${videoUri}&key=${apiKey}`);
    if (!response.ok) throw new Error("Failed to download video");
    
    const blob = await response.blob();
    return { blob, mimeType: 'video/mp4' };
}
