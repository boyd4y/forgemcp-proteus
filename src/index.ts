import { InputSchema, ProteusInput, createGeminiClient, DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL } from "./config";
import { getTemplate } from "./registry";
import { executeTemplate } from "./engine";

/**
 * Pure function to generate content using Proteus.
 * Can be called by CLI, API, or other agents.
 */
export async function generateContent(input: ProteusInput) {
  // 1. Validate Input
  const parsed = InputSchema.safeParse({
    topic: input.topic,
    style: input.style || "Casual",
    imageCount: input.imageCount || 4,
    apiKey: input.apiKey || process.env.GEMINI_API_KEY,
    model: input.model || process.env.GEMINI_MODEL,
    imageModel: input.imageModel, 
    generateImages: input.generateImages || false,
    template: input.template || "rednote-standard",
    referenceImages: input.referenceImages
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid input: " + parsed.error.message,
      code: "INVALID_INPUT",
    };
  }

  // 2. Setup
  const validatedInput = parsed.data;
  let modelName = validatedInput.model || DEFAULT_TEXT_MODEL;
  
  if (modelName.includes("gemini-3.0")) {
      console.warn("⚠️ Warning: 'gemini-3.0' is not a valid model ID. Using 'gemini-3-flash-preview' instead.");
      modelName = "gemini-3-flash-preview";
      validatedInput.model = modelName;
  }

  // 3. Initialize Client
  const { client, authType, authSource } = createGeminiClient(validatedInput.apiKey);
  console.warn(`\n🔑 Auth Mode: ${authType} | Source: ${authSource}\n`);

  try {
    // 4. Load Template
    console.log(`Using template: ${validatedInput.template}`);
    const template = getTemplate(validatedInput.template);

    // 5. Execute Template
    const context = await executeTemplate(client, template, validatedInput);

    // 6. Map Results (Legacy Support)
    // We assume the template produces 'contentData' with specific fields for the standard RedNote output.
    // Custom templates might produce different data, but we try to map what we can.
    
    const contentData = context.contentData || {};
    const generatedImages = context.generatedImages || [];

    const finalResult = {
      best_title: contentData.titles?.[0] || "",
      title: contentData.titles?.[0] || "",
      titles: contentData.titles,
      content: contentData.copywriting || contentData.content,
      tags: contentData.tags,
      outline: context.outline,
      imagePrompts: context.imagePrompts,
      generatedImages: generatedImages.length > 0 ? generatedImages : undefined,
      metadata: {
        model: modelName,
        imageModel: validatedInput.generateImages ? (validatedInput.imageModel || DEFAULT_IMAGE_MODEL) : undefined,
        style: validatedInput.style,
        topic: validatedInput.topic,
        template: validatedInput.template
      }
    };

    return {
      ok: true,
      data: finalResult,
      summary: `Generated content for topic '${validatedInput.topic}' using ${modelName} with template '${validatedInput.template}'. ${generatedImages.length > 0 ? `Generated ${generatedImages.length} images.` : ""}`,
    };

  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    // Check for common auth errors
    const isAuthError = errorMessage.includes("401") || 
                        errorMessage.includes("credential") || 
                        errorMessage.includes("API key");
    
    return {
      ok: false,
      error: errorMessage,
      code: isAuthError ? "AUTH_ERROR" : "API_ERROR",
    };
  }
}

// Default export for compatibility
export default generateContent;
