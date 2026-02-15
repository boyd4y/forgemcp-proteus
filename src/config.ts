import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

// 1. Input Schema (Centralized)
export const InputSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  style: z.enum(["Casual", "Professional", "Emotional", "Educational"]).default("Casual"),
  imageCount: z.number().min(3).max(9).default(3),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  template: z.string().default("rednote-standard").describe("Template ID to use"),
  imageModel: z.string().optional().describe("Image model (default: imagen-3.0-generate-001)"),
  generateImages: z.boolean().default(false).describe("Whether to generate actual images using the image model"),
});

export type ProteusInput = z.input<typeof InputSchema>;

// 2. Constants
export const DEFAULT_TEXT_MODEL = "gemini-3-flash-preview";
export const DEFAULT_IMAGE_MODEL = "gemini-3-pro-image-preview";

// 3. Helper: Secret Masking
export function maskSecret(str: string | undefined): string {
  if (!str || str.length < 8) return "****";
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

// 4. Client Initialization Logic
export function createGeminiClient(apiKey?: string): { client: GoogleGenAI; authType: string; authSource: string } {
  const clientConfig: any = {};
  let authType = "Unknown";
  let authSource = "Unknown";

  if (apiKey) {
    clientConfig.apiKey = apiKey;
    // Force AI Studio (Generative Language API) to prevent SDK from defaulting to Vertex AI
    // for certain models or when mixed configuration is present.
    clientConfig.vertexai = false; 
    authType = "AI Studio";
    authSource = `API Key (${maskSecret(apiKey)})`;
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    clientConfig.apiKey = undefined;
    clientConfig.vertexai = true;
    clientConfig.apiVersion = 'v1';
    clientConfig.project = process.env.GOOGLE_CLOUD_PROJECT;
    clientConfig.location = process.env.GOOGLE_CLOUD_LOCATION || 'global';
    clientConfig.googleAuthOptions = {
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS
    };
    authType = "Vertex AI";
    authSource = `Service Account (${process.env.GOOGLE_APPLICATION_CREDENTIALS})`;
  } else {
    authType = "Vertex AI (Auto-detect)";
    authSource = "ADC or GEMINI_API_KEY from Env";
  }

  return {
    client: new GoogleGenAI(clientConfig),
    authType,
    authSource
  };
}
