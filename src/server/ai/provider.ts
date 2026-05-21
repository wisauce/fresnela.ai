import "server-only";

export type AiEvidenceMappingOutput = {
  indicatorId: string;
  sourceDocumentId: string;
  paragraphIds: string[];
  citation: string;
  verbatimSnippet: string;
  reasoning: string;
  scoreSuggestion: 0 | 0.5 | 1;
  confidence: number;
  uncertaintyFlags: string[];
  requiresReview: boolean;
};

export type AiMappingResponse = {
  mappings: AiEvidenceMappingOutput[];
};

export function getAiProviderConfig() {
  return {
    baseUrl: process.env.AI_PROVIDER_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.AI_PROVIDER_API_KEY || "",
    model: process.env.AI_PROVIDER_MODEL || "gpt-4.1-mini",
    provider: "openai-compatible",
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (match) return match[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

export async function runOpenAiCompatibleMapping(input: {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
}): Promise<AiMappingResponse> {
  const config = getAiProviderConfig();
  if (!config.apiKey) throw new Error("AI mapping is not configured. Add AI_PROVIDER_API_KEY to run structured evidence mapping.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 45000);
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`AI provider failed with ${response.status}${text ? `: ${text.slice(0, 500)}` : ""}`);
    }
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("AI provider returned no message content.");
    const parsed = JSON.parse(extractJson(content)) as Partial<AiMappingResponse>;
    return { mappings: Array.isArray(parsed.mappings) ? parsed.mappings as AiEvidenceMappingOutput[] : [] };
  } finally {
    clearTimeout(timeout);
  }
}
