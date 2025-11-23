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
  return `SYSTEM INSTRUCTION:
You output machine-readable JSON only. No markdown, no code fences, no explanations outside JSON.
If you cannot produce 5 valid suggestions, output the ones you can and include an "explanation" field.

CRITICAL RULES:
- person_description field MUST be 8 words or less. Be concise.
- DO NOT include thinking process, word counts, or meta-commentary in your output.
- Output ONLY the final answer in each field, not your reasoning about it.`;
};

/**
 * Generate phonetic rules instruction block
 */
export const getPhoneticRules = (params: PAOPromptParams): string => {
  return `PHONETIC RULES FOR ${params.strNum}:
- The PERSON'S NAME must match Major System digits:
  - ${params.d1} = ${DIGIT_SOUNDS[params.d1]}
  - ${params.d2} = ${DIGIT_SOUNDS[params.d2]}
- The first consonant sound must correspond to digit ${params.d1}.
- The next consonant sound must correspond to digit ${params.d2}.
- Vowels (a, e, i, o, u) and w, h, y are ignored.
- Initials are allowed IF the spoken initial phonetics decode to ${params.strNum}.`;
};

/**
 * Output schema definition
 */
const getOutputSchema = (includeNotes: boolean = true): string => {
  if (includeNotes) {
    return `OUTPUT SCHEMA (EXACT):
{
  "suggestions": [
    {
      "person": "Person Name",
      "action": "Short iconic action",
      "object": "Short iconic object",
      "person_description": "Max 8 words (e.g., 'Wizard from Harry Potter')",
      "notes": "Phonetic decode (e.g., 'S(0) + D(1) = 01')"
    }
  ]
}`;
  } else {
    return `OUTPUT SCHEMA (EXACT):
{
  "suggestions": [
    {
      "person": "Person Name",
      "action": "Short iconic action",
      "object": "Short iconic object",
      "person_description": "Max 8 words describing who they are"
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

  return `${systemInstruction}

---

TASK:
Generate Person-Action-Object (PAO) suggestions using the Major System.
Target Number: ${params.strNum}
Theme: ${params.theme || 'General / Famous People'}

---

${phoneticRules}

---

REQUIREMENTS:
1. Generate 5 PAO suggestions where the PERSON'S NAME decodes to ${params.strNum}.
2. ACTION and OBJECT must be iconic, visual, and strongly associated with that person.
3. ACTION and OBJECT do NOT need to follow phonetics${params.strictMode ? ' (STRICT MODE: but should if possible)' : ''}.
4. Avoid generic verbs/nouns (no "walk", "bag").
5. Maintain thematic consistency.
6. person_description: MAXIMUM 8 WORDS describing who the person is.
7. notes: Short phonetic explanation (e.g., "S(0) + D(1) = 01").
8. Use the **exact schema** below.

---

${outputSchema}

Return ONLY valid JSON following the schema.`;
};

/**
 * Generate PAO suggestions prompt for specific person (non-strict mode)
 */
export const getPAOPersonPrompt = (params: PAOPromptParams): string => {
  const systemInstruction = getSystemInstruction();
  const outputSchema = getOutputSchema(false);

  return `${systemInstruction}

---

TASK:
Generate Action-Object pairs for a specific character.
User Selected Character: "${params.specificPerson}"

---

REQUIREMENTS:
1. The 'person' field MUST be exactly "${params.specificPerson}".
2. Generate 5 distinct Action and Object pairs that are ICONIC to this character.
3. ACTION must be something the character is famous for doing.
4. OBJECT must be an item/tool/weapon they frequently use or are strongly associated with.
5. IGNORE phonetic requirements for the Name (user already selected it).
6. Keep Action and Object short (3 words max each).
7. person_description: MAXIMUM 8 WORDS describing who they are.
8. Use the **exact schema** below.

---

${outputSchema}

Return ONLY valid JSON following the schema.`;
};

/**
 * Generate PAO suggestions prompt for specific person in strict mode
 */
export const getPAOStrictPersonPrompt = (params: PAOPromptParams): string => {
  const systemInstruction = getSystemInstruction();
  const phoneticRules = getPhoneticRules(params);
  const outputSchema = getOutputSchema(true);

  return `${systemInstruction}

---

TASK:
Generate Action-Object pairs for a specific character with PHONETIC CONSTRAINTS.
Target Number: ${params.strNum}
User Selected Character: "${params.specificPerson}"

---

${phoneticRules}

---

STRICT REQUIREMENTS (Strict Mode Active):
1. The 'person' field MUST be exactly "${params.specificPerson}".
2. The ACTION verb MUST phonetically decode to ${params.strNum}.
3. The OBJECT noun MUST phonetically decode to ${params.strNum}.
4. Make them thematically relevant to the person if possible, but PHONETIC FIT is the absolute priority.
5. person_description: MAXIMUM 8 WORDS describing who they are.
6. notes: Explain how Action and Object decode to ${params.strNum}.
7. Use the **exact schema** below.

---

${outputSchema}

Return ONLY valid JSON following the schema.`;
};

/**
 * Generate scene description prompt
 */
export const getSceneDescriptionPrompt = (params: ScenePromptParams): string => {
  return `SYSTEM INSTRUCTION:
You are an expert Memory Palace coach. Generate vivid, memorable scene descriptions.
Output only the scene description text (no JSON, no markdown).

---

TASK:
Create a "Director's Cut" scene description for a PAO (Person-Action-Object) memory.

Subject: ${params.person}
Action: ${params.action}
Object: ${params.object}

---

GOAL:
Create a "Sticky Memory" by invoking SENSES and EMOTIONS.

INSTRUCTIONS:
1. SENSORY FOCUS: Include at least ONE concrete sensory detail:
   - Smell (e.g., "reek of burned rubber", "fresh mint")
   - Sound (e.g., "wet squelch", "thunderous boom")
   - Touch (e.g., "freezing grit", "slimy texture")
   - Taste (e.g., "metallic tang", "bitter ash")

2. EMOTIONAL TRIGGER: Choose one clear emotion and make it obvious:
   - Disgust (gross, molding, bodily fluids)
   - Funny (absurd, slapstick, ridiculous)
   - Anger/Violence (shattering, crushing, screaming)
   - Fear (eerie, dangerous, nightmare)

3. CONCISE: Maximum 50 words. Present tense. Short, punchy sentences.

---

OUTPUT:
Return ONLY the scene description (no JSON, no extra text).`;
};

/**
 * Generate image generation prompt
 */
export const getImageGenerationPrompt = (sceneDescription: string): string => {
  return `Generate an image of: ${sceneDescription}`;
};
