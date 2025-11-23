# Prompt Example Output

When you run the app, you'll see console logs showing the exact prompts being sent to the LLM.

## Example Console Output

```
🤖 LLM Provider: gemini | Model: gemini-2.5-flash
📝 PAO Request: { number: 1, theme: "General / Famous People", specificPerson: undefined, strictMode: false }
📤 [Gemini] PAO Prompt:
```

## Example Prompt for Number 01

```
SYSTEM INSTRUCTION:
You output machine-readable JSON only. No markdown, no code fences, no explanations outside JSON.
If you cannot produce 5 valid suggestions, output the ones you can and include an "explanation" field.

---

TASK:
Generate Person-Action-Object (PAO) suggestions using the Major System.
Target Number: 01
Theme: General / Famous People

---

PHONETIC RULES FOR 01:
- The PERSON'S NAME must match Major System digits:
  - 0 = s, z, soft c
  - 1 = t, d, th
- The first consonant sound must correspond to digit 0.
- The next consonant sound must correspond to digit 1.
- Vowels (a, e, i, o, u) and w, h, y are ignored.
- Initials are allowed IF the spoken initial phonetics decode to 01.

---

REQUIREMENTS:
1. Generate 5 PAO suggestions where the PERSON'S NAME decodes to 01.
2. ACTION and OBJECT must be iconic, visual, and strongly associated with that person.
3. ACTION and OBJECT do NOT need to follow phonetics.
4. Avoid generic verbs/nouns (no "walk", "bag").
5. Maintain thematic consistency.
6. Use the **exact schema** below.

---

OUTPUT SCHEMA (EXACT):
{
  "suggestions": [
    {
      "person": "Person Name",
      "action": "Short iconic action",
      "object": "Short iconic object",
      "notes": "Optional: explain how the name decodes to the number",
      "person_description": "Short description of who the person is"
    }
  ]
}

Return ONLY valid JSON following the schema.
```

## Expected Response Format

```json
{
  "suggestions": [
    {
      "person": "Satoshi Nakamoto",
      "action": "mining",
      "object": "blockchain",
      "notes": "S(0) + T(1) = 01",
      "person_description": "Creator of Bitcoin"
    },
    {
      "person": "Steve Jobs",
      "action": "presenting",
      "object": "iPhone",
      "notes": "S(0) + T(1) + J(6) but J is ignored as it's after the second digit = 01",
      "person_description": "Co-founder of Apple Inc."
    }
  ]
}
```

## Testing Different Providers

To test different providers, simply change your `.env` file:

```bash
# Test with Gemini
VITE_GEMINI_API_KEY=your_key

# Test with OpenAI
# VITE_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=your_key

# Test with Ollama (local)
# VITE_GEMINI_API_KEY=
# VITE_OPENAI_API_KEY=
VITE_OLLAMA_BASE_URL=http://localhost:11434
```

The console will show which provider is active and the exact prompt being sent!
