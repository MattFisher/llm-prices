import { ModelEntry } from "./types";

export interface InspectModelCost {
  input: number;
  output: number;
  input_cache_write: number;
  input_cache_read: number;
}

export interface InspectResolutionError {
  model: string;
  candidates: string[];
}

export interface InspectExportResult {
  costs: Record<string, InspectModelCost>;
  unresolved: InspectResolutionError[];
}

/**
 * Inspect provider names do not always line up with the LiteLLM provider names
 * used in the cached dataset. This table captures the common provider-level
 * rewrites before model-level resolution happens.
 */
const PROVIDER_ALIASES: Record<string, string> = {
  azureai: "azure_ai",
  cf: "cloudflare",
  fireworks: "fireworks_ai",
  google: "gemini",
  grok: "xai",
  together: "together_ai",
};

function roundCost(value: number): number {
  return Number(value.toFixed(6));
}

function costPerMillion(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? roundCost(value * 1_000_000)
    : 0;
}

function splitInspectModelName(modelName: string): {
  provider: string | null;
  model: string;
} {
  const trimmed = modelName.trim();
  const slash = trimmed.indexOf("/");

  if (slash === -1) {
    return { provider: null, model: trimmed };
  }

  return {
    provider: trimmed.slice(0, slash),
    model: trimmed.slice(slash + 1),
  };
}

/**
 * Adds a candidate lookup key and, when helpful, a punctuation-normalized
 * variant. This is primarily used for model versions such as `4.5` vs `4-5`.
 */
function addCandidate(candidates: Set<string>, candidate: string): void {
  if (!candidate) {
    return;
  }

  candidates.add(candidate);

  if (candidate.includes(".")) {
    candidates.add(candidate.replace(/\./g, "-"));
  }
}

/**
 * Normalizes model identifiers for fuzzy comparison when exact key matching is
 * not enough. The goal is to be tolerant of `.`, `_`, and `-` differences while
 * still keeping provider segments intact.
 */
function normalizeForComparison(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split("/")
    .map((segment) => segment.replace(/[._-]+/g, "-"))
    .join("/");
}

/**
 * Returns the LiteLLM provider key that should be used for provider-scoped
 * matching.
 */
function providerAlias(provider: string): string {
  return PROVIDER_ALIASES[provider.toLowerCase()] ?? provider.toLowerCase();
}

/**
 * Expands a requested Inspect model name into the set of dataset keys that are
 * plausible matches. The first candidates preserve the user-supplied provider
 * prefix, and provider-specific rewrites add the equivalent LiteLLM forms.
 */
function candidateKeysForInspectModel(modelName: string): string[] {
  const trimmed = modelName.trim();
  const { provider, model } = splitInspectModelName(trimmed);
  const candidates = new Set<string>();

  if (!trimmed) {
    return [];
  }

  addCandidate(candidates, trimmed);

  if (!provider) {
    return [...candidates];
  }

  const providerLower = provider.toLowerCase();
  const aliasedProvider = providerAlias(providerLower);

  switch (providerLower) {
    case "openai":
    case "anthropic":
    case "bedrock":
    case "bedrock_converse":
    case "bedrock-converse":
      addCandidate(candidates, model);
      break;

    case "google":
      addCandidate(candidates, `gemini/${model}`);
      break;

    case "azureai":
      addCandidate(candidates, `azure_ai/${model}`);
      break;

    case "cf":
      addCandidate(candidates, `cloudflare/@cf/${model}`);
      addCandidate(candidates, `cloudflare/${model}`);
      addCandidate(candidates, `@cf/${model}`);
      break;

    case "together":
      addCandidate(candidates, `together_ai/${model}`);
      addCandidate(candidates, model);
      break;

    case "fireworks":
      addCandidate(candidates, `fireworks_ai/${model}`);
      addCandidate(candidates, model);
      break;

    case "grok":
      addCandidate(candidates, `xai/${model}`);
      addCandidate(candidates, model);
      break;

    case "deepseek":
      addCandidate(candidates, `deepseek/${model}`);
      addCandidate(candidates, model);
      break;

    default:
      addCandidate(candidates, `${aliasedProvider}/${model}`);
      break;
  }

  return [...candidates];
}

/**
 * Tries exact key matches first, then falls back to punctuation-normalized
 * comparisons. This keeps resolution deterministic while still handling common
 * naming differences between Inspect and LiteLLM.
 */
function findMatchingModel(
  models: ModelEntry[],
  candidates: string[]
): ModelEntry | null {
  const exactCandidates = new Set(
    candidates.map((candidate) => candidate.toLowerCase())
  );

  for (const model of models) {
    if (exactCandidates.has(model.key.toLowerCase())) {
      return model;
    }
  }

  const normalizedCandidates = new Set(
    candidates.map((candidate) => normalizeForComparison(candidate))
  );

  for (const model of models) {
    if (normalizedCandidates.has(normalizeForComparison(model.key))) {
      return model;
    }
  }

  return null;
}

/**
 * Resolves a requested Inspect model name against the cached model dataset.
 * When the request includes a provider, resolution is intentionally scoped to
 * that provider first so that overlapping model keys across providers do not
 * silently return the wrong entry.
 */
function findModelByCandidates(
  models: ModelEntry[],
  modelName: string
): ModelEntry | null {
  const candidates = candidateKeysForInspectModel(modelName);
  const { provider, model } = splitInspectModelName(modelName);
  if (!provider) {
    return findMatchingModel(models, candidates);
  }

  const aliasedProvider = providerAlias(provider);
  const providerModels = models.filter(
    (entry) => entry.litellm_provider?.toLowerCase() === aliasedProvider
  );
  const providerMatch = findMatchingModel(providerModels, candidates);
  if (providerMatch) {
    return providerMatch;
  }

  const normalizedModel = normalizeForComparison(model);
  for (const entry of providerModels) {
    if (normalizeForComparison(entry.key) === normalizedModel) {
      return entry;
    }
  }

  return null;
}

/**
 * Converts LiteLLM's per-token pricing fields into Inspect's dollars-per-million
 * `ModelCost` shape.
 */
export function toInspectModelCost(model: ModelEntry): InspectModelCost {
  return {
    input: costPerMillion(model.input_cost_per_token),
    output: costPerMillion(model.output_cost_per_token),
    input_cache_write: costPerMillion(model.cache_creation_input_token_cost),
    input_cache_read: costPerMillion(
      model.cache_read_input_token_cost ?? model.input_cost_per_token_cache_hit
    ),
  };
}

/**
 * Builds an Inspect-compatible export for the requested model names while also
 * reporting unresolved lookups together with the candidate keys that were tried.
 */
export function buildInspectCostExport(
  models: ModelEntry[],
  requestedModels: string[]
): InspectExportResult {
  const costs: Record<string, InspectModelCost> = {};
  const unresolved: InspectResolutionError[] = [];

  for (const requestedModel of requestedModels) {
    const trimmed = requestedModel.trim();
    if (!trimmed) {
      continue;
    }

    const resolved = findModelByCandidates(models, trimmed);
    if (!resolved) {
      unresolved.push({
        model: trimmed,
        candidates: candidateKeysForInspectModel(trimmed),
      });
      continue;
    }

    costs[trimmed] = toInspectModelCost(resolved);
  }

  return { costs, unresolved };
}

/**
 * Serializes the Inspect cost map into a minimal YAML document suitable for
 * writing directly to `--model-cost-config`. A trailing newline is included so
 * shell prompts do not get appended to the last line when using `curl -o`.
 */
export function renderInspectCostsYaml(
  costs: Record<string, InspectModelCost>
): string {
  const body = Object.entries(costs)
    .map(
      ([model, cost]) =>
        `${JSON.stringify(model)}:\n  input: ${cost.input}\n  output: ${cost.output}\n  input_cache_write: ${cost.input_cache_write}\n  input_cache_read: ${cost.input_cache_read}`
    )
    .join("\n");

  return body ? `${body}\n` : "";
}
