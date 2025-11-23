# LLM Timeout Configuration

All LLM providers now have timeout protection to prevent users from waiting indefinitely.

## Timeout Values

| Operation | Timeout | Reason |
|-----------|---------|--------|
| PAO Suggestions | 30 seconds | Text generation should be fast |
| Scene Description | 30 seconds | Short text generation |
| Image Generation | 60 seconds | Image processing takes longer |
| Video Generation | 120 seconds | Video processing is slowest |

## How It Works

### For Fetch-based Providers (OpenAI, OpenRouter, Ollama)
Uses `AbortController` to cancel the request after timeout:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
fetch(url, { signal: controller.signal });
```

### For Promise-based Providers (Gemini)
Uses `Promise.race()` to race the API call against a timeout:
```typescript
await withTimeout(
  ai.models.generateContent(...),
  DEFAULT_LLM_TIMEOUT,
  'Request timed out'
);
```

## Error Messages

When a timeout occurs, users see clear error messages:
- "Gemini API request timed out. Please try again."
- "OpenAI API request timed out. Please try again."
- "Request timed out after 30 seconds"

## Customizing Timeouts

To change timeout values, edit `services/llmUtils.ts`:

```typescript
export const DEFAULT_LLM_TIMEOUT = 30000; // 30 seconds
export const IMAGE_GENERATION_TIMEOUT = 60000; // 60 seconds
export const VIDEO_GENERATION_TIMEOUT = 120000; // 120 seconds
```

## Benefits

1. **Better UX** - Users don't wait forever
2. **Clear Feedback** - Timeout errors are explicit
3. **Resource Management** - Prevents hanging connections
4. **Consistent Behavior** - All providers have same timeout logic
