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

function candidateKeysForInspectModel(modelName: string): string[] {
  const trimmed = modelName.trim();
  const { provider, model } = splitInspectModelName(trimmed);
  const candidates = new Set<string>();

  if (!trimmed) {
    return [];
  }

  candidates.add(trimmed);

  if (!provider) {
    return [...candidates];
  }

  const providerLower = provider.toLowerCase();
  const aliasedProvider = PROVIDER_ALIASES[providerLower] ?? providerLower;

  switch (providerLower) {
    case "openai":
    case "anthropic":
    case "bedrock":
    case "bedrock_converse":
    case "bedrock-converse":
      candidates.add(model);
      break;

    case "google":
      candidates.add(`gemini/${model}`);
      break;

    case "azureai":
      candidates.add(`azure_ai/${model}`);
      break;

    case "cf":
      candidates.add(`cloudflare/@cf/${model}`);
      candidates.add(`cloudflare/${model}`);
      candidates.add(`@cf/${model}`);
      break;

    case "together":
      candidates.add(`together_ai/${model}`);
      candidates.add(model);
      break;

    case "fireworks":
      candidates.add(`fireworks_ai/${model}`);
      candidates.add(model);
      break;

    case "grok":
      candidates.add(`xai/${model}`);
      candidates.add(model);
      break;

    case "deepseek":
      candidates.add(`deepseek/${model}`);
      candidates.add(model);
      break;

    default:
      candidates.add(`${aliasedProvider}/${model}`);
      break;
  }

  return [...candidates];
}

function findModelByCandidates(
  models: ModelEntry[],
  modelName: string
): ModelEntry | null {
  const normalizedCandidates = new Set(
    candidateKeysForInspectModel(modelName).map((candidate) => candidate.toLowerCase())
  );

  for (const model of models) {
    if (normalizedCandidates.has(model.key.toLowerCase())) {
      return model;
    }
  }

  const { provider, model } = splitInspectModelName(modelName);
  if (!provider) {
    return null;
  }

  const aliasedProvider = PROVIDER_ALIASES[provider.toLowerCase()] ?? provider.toLowerCase();
  const normalizedModel = model.toLowerCase();

  for (const entry of models) {
    if (entry.litellm_provider?.toLowerCase() !== aliasedProvider) {
      continue;
    }

    const key = entry.key.toLowerCase();
    if (key === normalizedModel || key.endsWith(`/${normalizedModel}`)) {
      return entry;
    }
  }

  return null;
}

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

export function renderInspectCostsYaml(
  costs: Record<string, InspectModelCost>
): string {
  return Object.entries(costs)
    .map(
      ([model, cost]) =>
        `${JSON.stringify(model)}:\n  input: ${cost.input}\n  output: ${cost.output}\n  input_cache_write: ${cost.input_cache_write}\n  input_cache_read: ${cost.input_cache_read}`
    )
    .join("\n");
}
