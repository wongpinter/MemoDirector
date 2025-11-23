/**
 * Centralized prompt templates for LLM providers
 * All prompts are defined here to avoid redundancy and enable easy adjustments
 */

export interface PAOPromptParams {
  number: number;
  strNum: string;
  d1: string;
  d2: string;
  phonetics: string;
  theme: string;
  specificPerson?: string;
  strictMode?: boolean;
}

export interface ScenePromptParams {
  person: string;
  action: string;
  object: string;
}

/**
 * Generate phonetic rules instruction block
 */
export const getPhoneticRules = (params: PAOPromptParams): string => {
  return `
Phonetic Rules for Number ${params.strNum}:
- The word must be constructed using the Major System sounds.
- Digit 1 (${params.d1}): First consonant sound must be compatible.
- Digit 2 (${params.d2}): Next consonant sound must be compatible.
- Helper: ${params.phonetics}.
- Vowels (a,e,i,o,u) and 'w','h','y' are ignored and can be used freely as fillers.
  `.trim();
};

/**
 * Generate PAO suggestions prompt for specific person in strict mode
 */
export const getPAOStrictPersonPrompt = (params: PAOPromptParams): string => {
  const phoneticRules = getPhoneticRules(params);
  
  return `
I am building a Major System PAO memory list.
Target Number: ${params.strNum}

User Selected Character: "${params.specificPerson}"

${phoneticRules}

Task: Suggest 5 Action and Object pairs for "${params.specificPerson}".

STRICT CONSTRAINT (Strict Mode Active):
1. The Action verb MUST phonetically decode to ${params.strNum}.
2. The Object noun MUST phonetically decode to ${params.strNum}.
3. Try to make the Action and Object somewhat relevant to "${params.specificPerson}" if possible, but PHONETIC FIT is the absolute priority.

Output JSON Format:
{
  "suggestions": [
    { "person": "${params.specificPerson}", "action": "Phonetic Action", "object": "Phonetic Object", "reasoning": "Action matches ${params.strNum} because... Object matches ${params.strNum} because..." }
  ]
}
  `.trim();
};

/**
 * Generate PAO suggestions prompt for specific person (non-strict mode)
 */
export const getPAOPersonPrompt = (params: PAOPromptParams): string => {
  return `
I am building a Major System PAO memory list.
The user has already selected a specific character.

Character (Person): "${params.specificPerson}"

Task: Suggest 5 distinct Action and Object pairs that are ICONIC to "${params.specificPerson}".

Rules:
1. The 'Person' field in the output MUST be exactly "${params.specificPerson}".
2. The Action must be something this specific character is famous for doing.
3. The Object must be a tool, weapon, or item they frequently use.
4. Ignore phonetic rules for the Name (since the user provided it), but ensure the Action/Object helps visualize the character strongly.
5. Ensure the Action and Object are thematically consistent with the character's universe.

Output JSON Format per Schema.
  `.trim();
};

/**
 * Generate PAO suggestions prompt for general theme
 */
export const getPAOThemePrompt = (params: PAOPromptParams): string => {
  const phoneticRules = getPhoneticRules(params);
  
  return `
I am building a Major System PAO (Person-Action-Object) memory list.
Target Number: ${params.strNum}
Theme: ${params.theme}

${phoneticRules}

Task: Suggest 5 Person-Action-Object sets where the PERSON'S NAME phonetically matches ${params.strNum}.

Rules:
1. The Person's name MUST decode to ${params.strNum} based on Major System rules.
   - Example for 15 (T-L): "Ted Lasso", "Dalai Lama".
   - Example for 32 (M-N): "Moon Knight", "Mulan".
2. The Action and Object should be iconic to that person (thematic connection).
   - Action/Object do NOT need to fit phonetic rules (unless strict mode is requested, but assume standard mode here).
   - They must be highly visual.

Output JSON Format per Schema.
  `.trim();
};

/**
 * Generate scene description prompt
 */
export const getSceneDescriptionPrompt = (params: ScenePromptParams): string => {
  return `
You are an expert Memory Palace coach.
Generate a "Director's Cut" scene description for a PAO (Person-Action-Object) system.

Subject: ${params.person}
Action: ${params.action}
Object: ${params.object}

The goal is to create a "Sticky Memory" by invoking SENSES and EMOTIONS.

INSTRUCTIONS:
1.  **SENSORY FOCUS**: Do not rely on sight. You MUST include specific details for:
    -   **Smell** (e.g. burning rubber, rotting fish, fresh mint) OR
    -   **Sound** (e.g. high-pitched screech, wet squelch, thunderous boom) OR
    -   **Touch** (e.g. slimy, gritty, freezing cold, sticky) OR
    -   **Taste** (e.g. metallic blood, sour lemon, bitter ash).
2.  **EMOTIONAL TRIGGER**: The scene must trigger a specific feeling. Choose one:
    -   **Disgust** (Gross, molding, bodily fluids)
    -   **Funny** (Absurd, slapstick, ridiculous)
    -   **Anger/Violence** (Shattering, crushing, screaming)
    -   **Fear** (Eerie, dangerous, nightmare)
3.  **CONCISE**: Maximum 50 words. Short, punchy, present tense.

Example: ${params.person} furiously bites into the ${params.object}, which explodes with a screeching metal sound (Sound) and tastes like rotten eggs (Taste/Disgust).

Generate ONLY the vivid scene description.
  `.trim();
};

/**
 * Generate image generation prompt
 */
export const getImageGenerationPrompt = (sceneDescription: string): string => {
  return `Generate an image of: ${sceneDescription}`;
};
