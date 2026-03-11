export interface ModelEntry {
  key: string;
  litellm_provider: string;
  mode?: string;
  max_tokens?: number;
  max_input_tokens?: number;
  max_output_tokens?: number;
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  output_cost_per_reasoning_token?: number;
  input_cost_per_audio_token?: number;
  input_cost_per_pixel?: number;
  output_cost_per_image?: number;
  supports_function_calling?: boolean;
  supports_parallel_function_calling?: boolean;
  supports_vision?: boolean;
  supports_audio_input?: boolean;
  supports_audio_output?: boolean;
  supports_prompt_caching?: boolean;
  supports_reasoning?: boolean;
  supports_response_schema?: boolean;
  supports_system_messages?: boolean;
  supports_web_search?: boolean;
  deprecation_date?: string;
  [other: string]: unknown;
}

export interface FilterParams {
  provider?: string;
  mode?: string;
  q?: string;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
  supports?: string;
  max_input_cost?: number;
  min_context?: number;
}

export interface Env {
  MODEL_PRICES: KVNamespace;
  REFRESH_SECRET?: string;
}
