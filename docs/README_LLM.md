# Multi-LLM Provider Support

This application now supports multiple LLM providers for generating PAO suggestions and scene descriptions.

## Supported Providers

1. **Gemini** (Google) - Default, supports image/video generation
2. **OpenAI** (GPT models)
3. **OpenRouter** (Access to multiple models including Claude)
4. **Ollama** (Local LLM runner)

## Configuration

Set ONE of the following in your `.env` file:

```bash
# Gemini (Recommended)
VITE_GEMINI_API_KEY=your_key
VITE_GEMINI_MODEL=gemini-2.5-flash

# OpenAI
VITE_OPENAI_API_KEY=your_key
VITE_OPENAI_MODEL=gpt-4o-mini

# OpenRouter
VITE_OPENROUTER_API_KEY=your_key
VITE_OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Ollama (Local)
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2
```

## Provider Priority

If multiple providers are configured, the app uses this priority:
1. Gemini
2. OpenAI
3. OpenRouter
4. Ollama

## Architecture

- **Centralized Prompts** (`services/prompts.ts`) - All prompts in one place
- **Provider Interface** (`services/llmTypes.ts`) - Common interface for all providers
- **Individual Providers** - Each provider implements the interface
- **Unified Service** (`services/llmService.ts`) - Factory pattern for provider selection

## Notes

- Image/video generation only works with Gemini
- Ollama requires local installation
- All providers use the same prompts for consistency
