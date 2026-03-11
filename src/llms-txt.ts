import llmsMd from "./llms.md";

export function renderLlmsTxt(baseUrl: string): string {
  return llmsMd.replace(/\{\{BASE\}\}/g, baseUrl);
}
