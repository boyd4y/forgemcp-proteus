import path from "path";
import { GoogleGenAI } from "@google/genai";
import { ProteusInput, DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL } from "./config";
import { loadTemplate, renderTemplate, safeGenerateJSON, generateImage, readImage } from "./core";
import { ProteusContext, Template } from "./types";
import { PROCESSORS } from "./processors";

export async function executeTemplate(
  client: GoogleGenAI,
  template: Template,
  input: ProteusInput
): Promise<ProteusContext> {
  const context: ProteusContext = { ...input, templateBaseDir: template.baseDir };
  const modelName = input.model || DEFAULT_TEXT_MODEL;
  const imageModelName = input.imageModel || DEFAULT_IMAGE_MODEL;

  // Load reference images if any
  const referenceImages: { mimeType: string; data: string }[] = [];
  if (input.referenceImages && Array.isArray(input.referenceImages)) {
    console.log(`Loading ${input.referenceImages.length} reference images...`);
    for (const imgPath of input.referenceImages) {
      try {
        const imgData = await readImage(imgPath);
        referenceImages.push(imgData);
      } catch (error) {
        console.warn(`Failed to load reference image: ${imgPath}`, error);
      }
    }
  }

  for (const step of template.steps) {
    console.log(`[Step: ${step.name}] Executing...`);

    if (step.condition && !step.condition(context)) {
      console.log(`[Step: ${step.name}] Skipped (Condition met)`);
      continue;
    }

    try {
      if (step.type === "generate_text") {
        if (!step.template) throw new Error(`Step ${step.id} missing template`);
        
        // Resolve template path: relative to baseDir if set, otherwise assumes global templates dir (legacy)
        let templatePath = step.template;
        if (template.baseDir) {
            templatePath = path.join(template.baseDir, step.template);
        }

        const tmplContent = await loadTemplate(templatePath);
        const data = mapInput(step.inputMapping, context);
        const prompt = renderTemplate(tmplContent, data);
        
        const parts: any[] = [{ text: prompt }];
        if (referenceImages && referenceImages.length > 0) {
          for (const img of referenceImages) {
            parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
          }
        }

        const response = await client.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts }]
        });
        
        const text = typeof response.text === 'function' ? (response as any).text() : response.text;
        if (step.outputKey) {
          context[step.outputKey] = text;
        }

      } else if (step.type === "generate_json") {
        if (!step.template) throw new Error(`Step ${step.id} missing template`);

        let templatePath = step.template;
        if (template.baseDir) {
            templatePath = path.join(template.baseDir, step.template);
        }

        const tmplContent = await loadTemplate(templatePath);
        const data = mapInput(step.inputMapping, context);
        const prompt = renderTemplate(tmplContent, data);
        
        const jsonData = await safeGenerateJSON(client, modelName, prompt, referenceImages);
        if (step.outputKey) {
          context[step.outputKey] = jsonData;
        }

      } else if (step.type === "transform") {
        let handler = step.handler;
        
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
