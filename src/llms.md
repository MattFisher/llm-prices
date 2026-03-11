# LLM Prices

> A filterable, sortable directory of LLM model pricing data sourced from litellm. Provides a REST API and web UI for exploring costs, context windows, and capabilities across 2,700+ models from 100+ providers.

Data is refreshed every 6 hours from [litellm](https://github.com/BerriAI/litellm).

## API

- [List Models]({{BASE}}/api/models): GET — returns paginated model data. Supports query params: q, provider, mode, sort, order, limit, offset, supports, max_input_cost, min_context.
- [List Providers]({{BASE}}/api/providers): GET — returns all available provider names.
- [List Modes]({{BASE}}/api/modes): GET — returns all available model modes (chat, embedding, completion, etc.).
- [Metadata]({{BASE}}/api/meta): GET — returns cache metadata including last refresh timestamp and model count.
- [OpenAPI Spec]({{BASE}}/openapi.json): GET — full OpenAPI 3.0 specification for tool/MCP integration.

## Query Parameters for /api/models

- q: Free-text search across model name and provider
- provider: Filter by provider (e.g. openai, anthropic, gemini, bedrock)
- mode: Filter by mode (e.g. chat, embedding, completion, rerank)
- sort: Sort field (e.g. input_cost_per_token, output_cost_per_token, max_input_tokens, key)
- order: Sort direction (asc or desc)
- limit: Max results to return (default 100, max 10000)
- offset: Pagination offset
- supports: Comma-separated capabilities filter (e.g. supports_function_calling,supports_vision)
- max_input_cost: Max input cost per token (decimal)
- min_context: Minimum context window size in tokens

## Example Queries

- [All OpenAI chat models sorted by input cost]({{BASE}}/api/models?provider=openai&mode=chat&sort=input_cost_per_token&order=asc)
- [Models with vision and function calling under $5/1M input tokens]({{BASE}}/api/models?supports=supports_vision,supports_function_calling&max_input_cost=0.000005&sort=input_cost_per_token&order=asc)
- [All models with 100K+ context]({{BASE}}/api/models?min_context=100000&sort=max_input_tokens&order=desc)
- [Search for "claude"]({{BASE}}/api/models?q=claude&sort=input_cost_per_token&order=asc)

## Response Format

The /api/models endpoint returns JSON:

```json
{
  "total": 2702,
  "limit": 100,
  "offset": 0,
  "data": [
    {
      "key": "openai/gpt-4o",
      "litellm_provider": "openai",
      "mode": "chat",
      "input_cost_per_token": 0.0000025,
      "output_cost_per_token": 0.00001,
      "max_input_tokens": 128000,
      "max_output_tokens": 16384,
      "supports_function_calling": true,
      "supports_vision": true,
      "supports_prompt_caching": true
    }
  ]
}
```
