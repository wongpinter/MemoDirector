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
 * Major System digit to sound mapping
 */
const DIGIT_SOUNDS: Record<string, string> = {
  '0': 's, z, soft c',
  '1': 't, d, th',
  '2': 'n',
  '3': 'm',
  '4': 'r',
  '5': 'l',
  '6': 'j, sh, ch, soft g',
  '7': 'k, hard c, hard g, q',
  '8': 'f, v',
  '9': 'p, b'
};

/**
 * System instruction header
 */
const getSystemInstruction = (): string => {
  return `You are a Major System memory expert. Output valid JSON only.

RULES:
- person_description: Maximum 15 words
- notes: Show phonetic decode
- Use clean, final text in all fields`;
};

/**
 * Generate phonetic rules instruction block
 */
export const getPhoneticRules = (params: PAOPromptParams): string => {
  return `TARGET: ${params.strNum}

MAJOR SYSTEM MAPPING:
- First sound: ${params.d1} = ${DIGIT_SOUNDS[params.d1]}
- Second sound: ${params.d2} = ${DIGIT_SOUNDS[params.d2]}
- Vowels (a,e,i,o,u,w,h,y) are silent
- Use first two consonant sounds from the name

NOTES FIELD - PHONETIC DECODE EXPLANATION:
The notes field explains HOW the name decodes to ${params.strNum}.
Show the reasoning step by step:
1. Identify the first two consonant sounds in the name
2. Map each consonant to its digit using Major System
3. Format: "Letter(digit)+Letter(digit)=${params.strNum}"

Examples:
- "Stitch" → First consonant is S (digit 0), second is T (digit 1) → "S(0)+T(1)=01"
- "Tony" → First consonant is T (digit 1), second is N (digit 2) → "T(1)+N(2)=12"
- "Syd" → First consonant is S (digit 0), second is D (digit 1) → "S(0)+D(1)=01"
- "Buzz Lightyear" → B (digit 9), Z (digit 0) → "B(9)+Z(0)=90"

The notes field helps users understand the phonetic logic.`;
};

/**
 * Output schema definition
 */
const getOutputSchema = (includeNotes: boolean = true): string => {
  if (includeNotes) {
    return `EXAMPLE OUTPUT:
{
  "suggestions": [
    {
      "person": "Stitch",
      "action": "Experimenting",
      "object": "Ukulele",
      "person_description": "Alien experiment 626 from Lilo and Stitch",
      "notes": "Stitch: S(0)+T(1)=01. First consonant S maps to 0, second consonant T maps to 1."
    }
  ]
}

The notes field should explain the phonetic decode clearly.`;
  } else {
    return `OUTPUT SCHEMA (EXACT):
{
  "suggestions": [
    {
      "person": "Person Name",
      "action": "Short iconic action",
      "object": "Short iconic object",
      "person_description": "Max 15 words describing who they are"
    }
  ]
}`;
  }
};

/**
 * Generate PAO suggestions prompt for general theme
 */
export const getPAOThemePrompt = (params: PAOPromptParams): string => {
  const systemInstruction = getSystemInstruction();
  const phoneticRules = getPhoneticRules(params);
  const outputSchema = getOutputSchema(true);

  if (params.strictMode) {
    return `${systemInstruction}

Generate PAO (Person-Action-Object) memory suggestions.
Theme: ${params.theme || 'General / Famous People'}
STRICT MODE: ALL three components (Person, Action, Object) must decode to ${params.strNum}

${phoneticRules}

TASK:
- Generate 5 suggestions where ALL THREE decode to ${params.strNum}
- PERSON name decodes to ${params.strNum}
- ACTION verb decodes to ${params.strNum}
- OBJECT noun decodes to ${params.strNum}
- person_description: 15 words maximum
- notes: Explain phonetic decode for ALL THREE with reasoning (e.g., "Person 'Stitch': S(0)+T(1)=01. Action 'Stealing': S(0)+T(1)=01. Object 'Satellite': S(0)+T(1)=01.")

${outputSchema}`;
  }

  return `${systemInstruction}

Generate PAO (Person-Action-Object) memory suggestions.
Theme: ${params.theme || 'General / Famous People'}

${phoneticRules}

TASK:
- Generate 5 suggestions where PERSON name decodes to ${params.strNum}
- ACTION and OBJECT: iconic and memorable for that person (phonetics optional)
- person_description: 15 words maximum
- notes: Explain phonetic decode with reasoning (e.g., "Stitch: S(0)+T(1)=01. S is the first consonant mapping to 0, T is the second mapping to 1.")

${outputSchema}`;
};

/**
 * Generate PAO suggestions prompt for specific person (non-strict mode)
 */
export const getPAOPersonPrompt = (params: PAOPromptParams): string => {
  const systemInstruction = getSystemInstruction();
  const outputSchema = getOutputSchema(false);

  return `${systemInstruction}

Generate Action-Object pairs for: "${params.specificPerson}"

TASK:
- Person: "${params.specificPerson}" (exact match)
- Generate 5 iconic ACTION and OBJECT pairs
- ACTION: what they're famous for doing
- OBJECT: item they use or are associated with
- person_description: 15 words maximum

${outputSchema}`;
};

/**
 * Generate PAO suggestions prompt for specific person in strict mode
 */
export const getPAOStrictPersonPrompt = (params: PAOPromptParams): string => {
  const systemInstruction = getSystemInstruction();
  const phoneticRules = getPhoneticRules(params);
  const outputSchema = getOutputSchema(true);

  return `${systemInstruction}

Generate Action-Object pairs for: "${params.specificPerson}"
STRICT MODE: Action and Object must BOTH decode to ${params.strNum}

${phoneticRules}

TASK:
- Person: "${params.specificPerson}" (exact match, user selected)
- ACTION verb must decode to ${params.strNum} using Major System
- OBJECT noun must decode to ${params.strNum} using Major System
- person_description: 15 words maximum
- notes: Explain phonetic decode for Action and Object with reasoning (e.g., "Action 'Stealing': S(0)+T(1)=01. Object 'Satellite': S(0)+T(1)=01. Both decode to 01.")

${outputSchema}`;
};

/**
 * Generate scene description prompt
 */
export const getSceneDescriptionPrompt = (params: ScenePromptParams): string => {
  return `Create a memorable scene using everyday words. Be descriptive and vivid.

SCENE:
Person: ${params.person}
Action: ${params.action}
Object: ${params.object}

MAKE IT VIVID & EMOTIONAL:
Write a scene that makes people FEEL something through their senses.

Focus on the ACTION and OBJECT - they are the memory anchors.

Add sensory details:
- What does it look like? (colors, size, movement)
- What does it sound like? (loud, quiet, sharp, soft)
- What does it feel like? (rough, smooth, hot, cold, wet, dry)
- What does it smell like? (strong, faint, good, bad)

Make it emotional:
- Exciting: fast, intense, powerful
- Funny: weird, silly, unexpected
- Gross: messy, slimy, smelly
- Scary: dark, dangerous, creepy

Use everyday words. Be descriptive. Maximum 60 words.

Write the scene:`;
};

/**
 * Generate image generation prompt
 */
export const getImageGenerationPrompt = (sceneDescription: string): string => {
  return `Generate an image of: ${sceneDescription}`;
};
