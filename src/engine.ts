import path from "path";
import { GoogleGenAI } from "@google/genai";
import { ProteusInput, DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL } from "./config";
import { loadTemplate, renderTemplate, safeGenerateJSON, generateImage } from "./core";
import { ProteusContext, Template } from "./types";
import { PROCESSORS } from "./processors";

export async function executeTemplate(
  client: GoogleGenAI,
  template: Template,
  input: ProteusInput
): Promise<ProteusContext> {
  const context: ProteusContext = { ...input };
  const modelName = input.model || DEFAULT_TEXT_MODEL;
  const imageModelName = input.imageModel || DEFAULT_IMAGE_MODEL;

  for (const step of template.steps) {
    console.log(`[Step: ${step.name}] Executing...`);

    if (step.condition && !step.condition(context)) {
      console.log(`[Step: ${step.name}] Skipped (Condition met)`);
      continue;
    }

    try {
      if (step.type === "generate_text") {
        if (!step.template) throw new Error(`Step ${step.id} missing template`);
        
        const tmplContent = await loadTemplate(step.template);
        const data = mapInput(step.inputMapping, context);
        const prompt = renderTemplate(tmplContent, data);
        
        const response = await client.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        
        const text = typeof response.text === 'function' ? (response as any).text() : response.text;
        if (step.outputKey) {
          context[step.outputKey] = text;
        }

      } else if (step.type === "generate_json") {
        if (!step.template) throw new Error(`Step ${step.id} missing template`);

        const tmplContent = await loadTemplate(step.template);
        const data = mapInput(step.inputMapping, context);
        const prompt = renderTemplate(tmplContent, data);
        
        const jsonData = await safeGenerateJSON(client, modelName, prompt);
        if (step.outputKey) {
          context[step.outputKey] = jsonData;
        }

      } else if (step.type === "transform") {
        let handler = step.handler;
        
        // Lookup handler by ID if provided (for JSON/serializable templates)
        if (!handler && step.handlerId) {
          handler = PROCESSORS[step.handlerId];
          if (!handler) throw new Error(`Processor '${step.handlerId}' not found in registry`);
        }
        
        if (!handler) throw new Error(`Step ${step.id} missing handler or handlerId`);
        
        const result = await handler(context);
        if (step.outputKey) {
          context[step.outputKey] = result;
        }

      } else if (step.type === "generate_images") {
        const sourceKey = step.promptSourceKey || "imagePrompts";
        const prompts = context[sourceKey];
        
        if (Array.isArray(prompts) && prompts.length > 0) {
          console.log(`Generating ${prompts.length} images...`);
          const outputDir = path.join(process.cwd(), "output", Date.now().toString());
          const generatedPaths: string[] = [];

          for (let i = 0; i < prompts.length; i++) {
            const prompt = prompts[i];
            const imagePath = await generateImage(client, imageModelName, prompt, outputDir, i);
            if (imagePath) {
              generatedPaths.push(imagePath);
            }
          }
          
          if (generatedPaths.length > 0) {
            context.generatedImages = generatedPaths; // Default key
            if (step.outputKey) context[step.outputKey] = generatedPaths;
          }
        }
      }

    } catch (error) {
      console.error(`[Step: ${step.name}] Failed:`, error);
      throw error;
    }
  }

  return context;
}

function mapInput(mapping: Record<string, string> | undefined, context: ProteusContext): Record<string, any> {
  if (!mapping) return context; 
  
  const data: Record<string, any> = {};
  for (const [tmplVar, ctxKey] of Object.entries(mapping)) {
    data[tmplVar] = context[ctxKey];
  }
  return data;
}
