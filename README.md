# LLM Prices

A Cloudflare Worker that caches [litellm's model pricing data](https://github.com/BerriAI/litellm) and provides:

- **Web UI** — filterable, sortable table of all LLM model prices
- **REST API** — query models by provider, mode, capabilities, cost, and context window
- **MCP server** — native remote MCP endpoint at `/mcp`
- **OpenAPI spec** — at `/openapi.json` for integration with LLM tools and MCP clients

Data is refreshed automatically every 6 hours via cron trigger. Zero ongoing cost on Cloudflare's free tier.

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

On first run, visit `http://localhost:8787` — the table will be empty until data is loaded.
Trigger a data refresh by calling the scheduled handler (wrangler dev supports this via the dashboard).

## Deploy

### 1. Create KV Namespace

```bash
npx wrangler kv namespace create MODEL_PRICES
```

Copy the outputted ID and replace `PLACEHOLDER_KV_ID` in `wrangler.toml`.

For local dev, also create a preview namespace:

```bash
npx wrangler kv namespace create MODEL_PRICES --preview
```

Add the preview ID to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MODEL_PRICES"
id = "YOUR_PRODUCTION_ID"
preview_id = "YOUR_PREVIEW_ID"
```

### 2. Deploy

```bash
npm run deploy
```

### 3. Seed Initial Data

After deploying, trigger the cron manually from the Cloudflare dashboard (Workers → your worker → Triggers → Cron → Trigger Now), or wait up to 6 hours for the first automatic refresh.

## API

### `GET /api/models`

Query parameters:

| Param | Description |
| ----- | ----------- |
| `q` | Search model name or provider; supports wildcards like `gpt-*-codex` and multi-term queries like `claude sonnet` |
| `provider` | Filter by provider (e.g. `openai`, `anthropic`) |
| `mode` | Filter by mode (`chat`, `embedding`, `completion`, etc.) |
| `supports` | Comma-separated capabilities (`vision`, `function_calling`, `reasoning`, `prompt_caching`) |
| `max_input_cost` | Max input cost per token |
| `min_context` | Minimum context window (tokens) |
| `sort` | Sort field (e.g. `input_cost_per_token`, `max_input_tokens`) |
| `order` | `asc` or `desc` |
| `limit` | Results per page (default 100) |
| `offset` | Pagination offset |

### `GET /api/providers`

List all available providers.

### `GET /api/modes`

List all available model modes.

### `GET /api/meta`

Cache metadata (last update time).

### `GET /openapi.json`

OpenAPI 3.1 spec for tool/MCP integration.

## MCP

### `POST /mcp`

Remote MCP server endpoint exposed over Streamable HTTP.

Available tools:

- `search_models` — search and filter models using the same provider/mode/query/capability/cost/context filters as the REST API
- `list_providers` — list all known providers
- `list_modes` — list all known model modes
- `get_metadata` — return the last refresh timestamp and total model count

For clients that support remote MCP directly, use:

```text
https://your-worker.your-subdomain.workers.dev/mcp
```

For clients that only support local stdio MCP, bridge with `mcp-remote`:

```json
{
  "mcpServers": {
    "llm-prices": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-worker.your-subdomain.workers.dev/mcp"
      ]
    }
  }
}
```

## Using with LLMs / OpenAPI

The `/openapi.json` endpoint can be used directly with clients that support OpenAPI-based tool import.

Example: find the cheapest chat models with vision support and 100K+ context:

```text
GET /api/models?mode=chat&supports=vision&min_context=100000&sort=input_cost_per_token&order=asc&limit=10
```

## License

MIT
