/**
 * prompts/paos.ts
 *
 * Centralized, provider-aware prompt templates for Major System PAO generation.
 * - Supports OpenAI vs Claude minor wording differences (JSON-only enforcement, verbosity).
 * - Adds initials rule (initials allowed when their phonetic spoken form matches the Major System).
 * - Consolidates strict and non-strict variants and scene description generation.
 */

export type Provider = "openai" | "claude";

export interface PAOPromptParams {
  number: number;
  strNum: string;            // e.g. "15"
  d1: string;                // digit1 phonetic hint (e.g. "T")
  d2: string;                // digit2 phonetic hint (e.g. "L")
  phonetics: string;         // helper text for phonetics
  theme?: string;            // optional theme like "movies", "historical figures"
  specificPerson?: string;   // optional preselected person name
  strictMode?: boolean;      // prefer phonetic fit for action/object as well
  allowInitials?: boolean;   // whether initials that match phonetics are permitted (default true)
}

export interface ScenePromptParams {
  person: string;
  action: string;
  object: string;
}

/**
 * Provider header / safety text differences
 * Small variations to improve reliability per LLM provider quirks.
 */
const providerHeader = (provider: Provider): string => {
  if (provider === "openai") {
    return [
      "SYSTEM NOTE: You are an assistant that outputs machine-parseable JSON only.",
      "Respond ONLY with valid JSON conforming to the requested schema. No extra commentary, no markdown fences.",
      "If you cannot produce 5 distinct entries, produce as many valid entries as possible and include an `explanation` field describing the shortfall."
    ].join("\n");
  }

  // claude (slightly friendlier, explicitly no markdown or code fences)
  return [
    "SYSTEM NOTE: Produce machine-parseable JSON only — no markdown, no code fences, no extra text.",
    "Return a JSON object exactly matching the requested schema. If fewer than 5 suggestions are possible, return the ones you can and include an `explanation` string explaining why fewer."
  ].join("\n");
};

/**
 * Phonetic rules block (re-usable)
 */
export const getPhoneticRules = (params: PAOPromptParams): string => {
  const allowInitials = params.allowInitials !== false; // default true
  return [
    `Phonetic Rules for Number ${params.strNum}:`,
    `- Word/Name must be constructed using Major System consonant-to-digit mapping.`,
    `- Digit 1 (${params.d1}): the first consonant sound must correspond to this digit.`,
    `- Digit 2 (${params.d2}): the second consonant sound must correspond to this digit.`,
    `- Helper phonetics: ${params.phonetics}`,
    `- Vowels (a,e,i,o,u) and the letters w, h, y are ignored (they are fillers).`,
    allowInitials ? `- You MAY use initials (e.g., "J.R." pronounced "jay-are") IF the spoken initials' phonetics match the target number.` : `- Initials are NOT allowed for this prompt.`,
  ].join("\n");
};

/**
 * JSON schema helper - short example placed in prompts to reduce hallucination
 */
const jsonSchemaExample = (params: PAOPromptParams) => {
  return [
    "Output JSON Schema (EXACT):",
    "{",
    '  "suggestions": [',
    '    { "person": "Person Name", "action": "Verb / short phrase", "object": "Noun / short phrase", "notes": "Short reasoning (optional)" }',
    "  ]",
    "}"
  ].join("\n");
};

/**
 * Theme-based PAO prompt (standard and permissive by default)
 * Adds the initials rule and provider header.
 */
export const getPAOThemePrompt = (params: PAOPromptParams, provider: Provider = "openai"): string => {
  const phoneticRules = getPhoneticRules(params);
  const header = providerHeader(provider);

  return [
    header,
    "",
    `I am building a Major System PAO (Person-Action-Object) memory list.`,
    `Target Number: ${params.strNum}`,
    params.theme ? `Theme: ${params.theme}` : `Theme: (general)`,
    "",
    phoneticRules,
    "",
    `Task: Suggest 5 distinct Person-Action-Object sets where the PERSON'S NAME phonetically matches ${params.strNum} according to the Major System rules.`,
    "",
    "Rules:",
    `1. The Person's NAME MUST decode to ${params.strNum} using Major System rules (initials allowed per the phonetic rules above).`,
    "   - Examples (for clarity):",
    "     - 15 (T-L): \"Ted Lasso\", \"Dalai Lama\".",
    "     - 32 (M-N): \"Moon Knight\", \"Mulan\".",
    "2. The Action and Object should be ICONIC and HIGHLY VISUAL for that person. They do NOT need to decode phonetically unless `strictMode` is true.",
    "3. Prefer unique, strongly imagable actions and objects — avoid generic verbs/nouns (no 'walk' + 'bag').",
    "4. Maintain thematic relevance: action/object must be strongly associated with the person or their public image.",
    params.strictMode ? "STRICT MODE: Additionally, the Action and Object SHOULD each phonetically match the same target number where possible. Mark phonetic matches in `notes`." : "",
    "",
    jsonSchemaExample(params),
    "",
    `Generation notes: Produce exactly 5 array items if possible. Use short ` + "`notes`" + ` field to explain phonetic decoding (e.g., \"name -> ${params.strNum} because ...\").`
  ].join("\n");
};

/**
 * Person-specific PAO prompt (non-strict)
 */
export const getPAOPersonPrompt = (params: PAOPromptParams, provider: Provider = "openai"): string => {
  const header = providerHeader(provider);
  const allowInitials = params.allowInitials !== false ? "Initials allowed if phonetics match." : "Initials not allowed.";
  return [
    header,
    "",
    `I am building a Major System PAO memory list.`,
    `User Selected Character: "${params.specificPerson}"`,
    "",
    "Task: Suggest 5 distinct Action and Object pairs that are ICONIC to the specified character.",
    "",
    "Rules:",
    `1. The 'person' field MUST be exactly "${params.specificPerson}".`,
    "2. The Action must be something the character is famous for doing (or an iconic gesture).",
    "3. The Object must be an item/tool/weapon this character frequently uses or is strongly associated with.",
    "4. IGNORE phonetic requirements for the provided Name (the user already selected it), but if you can make Action/Object phonetic matches in `notes`, include that as extra value.",
    `5. ${allowInitials}`,
    "",
    jsonSchemaExample(params),
    "",
    "Generation notes: Produce exactly 5 items when possible. Keep Action and Object short (3 words max each)."
  ].join("\n");
};

/**
 * Person-specific strict mode prompt (name provided; actions/objects must match phonetics)
 */
export const getPAOStrictPersonPrompt = (params: PAOPromptParams, provider: Provider = "openai"): string => {
  const phoneticRules = getPhoneticRules(params);
  const header = providerHeader(provider);

  return [
    header,
    "",
    `I am building a Major System PAO memory list.`,
    `Target Number: ${params.strNum}`,
    `User Selected Character: "${params.specificPerson}"`,
    "",
    phoneticRules,
    "",
    "Task: Suggest 5 Action and Object pairs for the specified person where PHONETICS ARE REQUIRED.",
    "",
    "STRICT CONSTRAINTS (Strict Mode Active):",
    `1. The Action verb MUST phonetically decode to ${params.strNum}.`,
    `2. The Object noun MUST phonetically decode to ${params.strNum}.`,
    "3. Make them thematically relevant to the person if possible, but PHONETIC FIT is the absolute priority.",
    "",
    jsonSchemaExample(params),
    "",
    "JSON notes: In the `notes` field explain how each Action/Object decodes to the target number (mapping)."
  ].join("\n");
};

/**
 * Scene description prompt: Director's Cut for Memory Palace (improved constraints + maximum length)
 */
export const getSceneDescriptionPrompt = (params: ScenePromptParams, provider: Provider = "openai"): string => {
  const header = providerHeader(provider);
  return [
    header,
    "",
    "You are an expert Memory Palace coach. Generate a single short 'Director's Cut' scene description for a PAO (Person-Action-Object) entry.",
    "",
    `Subject: ${params.person}`,
    `Action: ${params.action}`,
    `Object: ${params.object}`,
    "",
    "Goal: Create a 'Sticky Memory' by invoking SENSES and EMOTION. Do not rely only on visual details.",
    "",
    "INSTRUCTIONS:",
    "1. SENSORY FOCUS: Include at least ONE of the following with a concrete detail: Smell, Sound, Touch, or Taste. (Example: 'reek of burned rubber', 'wet squelch', 'freezing grit', 'metallic tang')",
    "2. EMOTIONAL TRIGGER: Choose one clear emotion for the scene: Disgust, Funny, Anger/Violence, or Fear. Make that emotion obvious.",
    "3. CONCISE: Max 50 words. Present tense. Short, punchy sentences. No lists, no extra commentary.",
    "",
    "Output: Single sentence or very short paragraph (<= 50 words). Return only the scene description string (no JSON unless explicitly requested)."
  ].join("\n");
};

/**
 * Image generation prompt generator (simple wrapper)
 */
export const getImageGenerationPrompt = (sceneDescription: string): string => {
  // Keep image prompt concise; external tool will handle style/size.
  return `Generate a photorealistic or stylized image of the following memory scene:\n\n${sceneDescription}\n\nFocus on clarity of person, action, and object. Emphasize sensory elements described (smells/sounds/tactile cues) in a visually representable way.`;
};

/**
 * Utility: Example function showing how to choose which prompt generator to call
 */
export const buildPAOPrompt = (params: PAOPromptParams, provider: Provider = "openai") => {
  // If user provided specificPerson and strictMode true -> strict person prompt
  if (params.specificPerson && params.strictMode) {
    return getPAOStrictPersonPrompt(params, provider);
  }
  if (params.specificPerson) {
    return getPAOPersonPrompt(params, provider);
  }
  // otherwise general theme prompt
  return getPAOThemePrompt(params, provider);
};
