import type { z } from "zod";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type Usage = { model: string; inputTokens: number; outputTokens: number };

export type GenerateRequest = {
  model: string;
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
};

/**
 * The only thing the pipeline knows about LLMs. Anthropic implements it today;
 * an OpenAI implementation would satisfy the same interface.
 */
export interface LLMProvider {
  /** Free-text generation. Throws on API errors and refusals. */
  generate(req: GenerateRequest): Promise<{ text: string; usage: Usage }>;
  /**
   * JSON generation validated against `schema`.
   * Throws on API errors, refusals, truncation, or output that fails validation —
   * callers decide whether that failure means block (fail closed) or allow (fail open).
   */
  generateJSON<T>(req: GenerateRequest & { schema: z.ZodType<T> }): Promise<{ data: T; usage: Usage }>;
}
