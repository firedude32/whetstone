import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { GenerateRequest, LLMProvider, Usage } from "./types";

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(req: GenerateRequest): Promise<{ text: string; usage: Usage }> {
    const res = await this.client.messages.create({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: req.messages,
    });
    if (res.stop_reason === "refusal") throw new Error("model refused");
    const text = res.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();
    return { text, usage: usageOf(req.model, res.usage) };
  }

  async generateJSON<T>(req: GenerateRequest & { schema: z.ZodType<T> }): Promise<{ data: T; usage: Usage }> {
    // Structured outputs: the API constrains generation to the schema's JSON shape,
    // and the SDK validates the result (including constraints the API can't enforce).
    const res = await this.client.messages.parse({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: req.messages,
      output_config: { format: zodOutputFormat(req.schema) },
    });
    if (res.stop_reason === "refusal") throw new Error("model refused");
    if (res.stop_reason === "max_tokens") throw new Error("JSON output truncated");
    if (res.parsed_output == null) throw new Error("no parsed output");
    return { data: res.parsed_output as T, usage: usageOf(req.model, res.usage) };
  }
}

function usageOf(model: string, u: { input_tokens: number; output_tokens: number }): Usage {
  return { model, inputTokens: u.input_tokens, outputTokens: u.output_tokens };
}
