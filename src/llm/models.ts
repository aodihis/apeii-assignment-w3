import { OpenAIClient } from "@anvia/openai";
import "dotenv/config";

const apiKey = process.env.LLM_API_KEY;

if (!apiKey) {
  throw new Error("LLM_API_KEY is required to initialize the LLM client");
}

export const client = new OpenAIClient({
  apiKey,
  baseUrl: process.env.LLM_BASE_URL,
});

export function getModel(modelId?: string) {
  return client.completionModel({
    modelId: modelId || "gpt-5.6-luna",
  });
}
