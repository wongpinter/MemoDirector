# LLM Thinking Cleanup

Some LLM models (especially reasoning models) include their "thinking process" in the output. We automatically clean this up.

## Examples of Cleaned Patterns

### Before Cleanup:
```
"Naughty kid who tortures his toys mercilessly. From Toy Story. (6 words - ok!) No! 7 words. Still OK! My bad, I'll count carefully now. Naughty kid who tortures his toys. 6 words. Oh, the previous one was 'Naughty kid who tortures his toys.' 6 words. Let me rephrase for 8 or less. Naughty kid who tortures his toys. Ok, that's 6 words. Okay, I'll stick to that. I'm overthinking this."
```

### After Cleanup:
```
"Naughty kid who tortures his toys"
```

## Patterns Removed

The `cleanLLMThinking()` function removes:

1. **Word counts**: `(6 words)`, `(7 words - ok!)`
2. **Self-correction**: `Ok, that's 6 words`, `No! 7 words`
3. **Meta-commentary**: `Wait, I need to check...`, `Let me rephrase...`
4. **Uncertainty**: `I'll stick to that`, `I'm overthinking this`
5. **References**: `Oh, the previous one was...`
6. **Affirmations**: `Still OK!`, `My bad`

## Word Limit Enforcement

After cleaning, we also enforce the 8-word maximum:

```typescript
enforceWordLimit(cleanedText, 8)
```

This ensures even if the LLM ignores the instruction, we hard-cap at 8 words.

## Where It's Applied

Cleaning happens in all providers:
- ✅ Gemini
- ✅ OpenAI
- ✅ OpenRouter (extends OpenAI)
- ✅ Ollama

Applied to these fields:
- `person_description` - cleaned + 8-word limit
- `notes` - cleaned (no word limit)

## Prevention in Prompts

We also updated the system instruction to prevent this:

```
CRITICAL RULES:
- DO NOT include thinking process, word counts, or meta-commentary in your output.
- Output ONLY the final answer in each field, not your reasoning about it.
```

This two-layer approach (prevention + cleanup) ensures clean output!
