import fs from "fs/promises";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// 1. Template Loading
export async function loadTemplate(name: string): Promise<string> {
  const templatePath = name;
  return await fs.readFile(templatePath, "utf-8");
}

export const renderTemplate = (template: string, data: Record<string, any>) => {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : `{{ ${key} }}`;
  });
};

// 2. Safe JSON Generation
export async function safeGenerateJSON(client: GoogleGenAI, modelName: string, prompt: string): Promise<any> {
  const response = await client.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
    }
  });

  const responseText = typeof response.text === 'function' ? (response as any).text() : response.text;
  
  if (!responseText) {
    throw new Error("Empty response from AI");
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```([\s\S]*?)```/) || [null, responseText];
    let jsonStr = jsonMatch[1] || responseText;
    jsonStr = jsonStr.trim();
    return JSON.parse(jsonStr);
  }
}

// 3. Image Generation
export async function generateImage(client: GoogleGenAI, imageModel: string, prompt: string, outputDir: string, index: number): Promise<string | null> {
  try {
    let imageBuffer: Buffer | null = null;

    // Strategy 1: Gemini Models (generateContent)
    // e.g. gemini-2.0-flash
    if (imageModel.toLowerCase().startsWith("gemini")) {
      const response = await client.models.generateContent({
        model: imageModel,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        }
      });

      // Parse Gemini response for inline image data
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts) {
          // Look for part with inlineData
          const imagePart = parts.find((part: any) => part.inlineData && part.inlineData.data);
          if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
            imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
          }
        }
      }
    } 
    // Strategy 2: Imagen Models (generateImages)
    // e.g. imagen-3.0-generate-001
    else {
      const response = await client.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "3:4", 
          outputMimeType: "image/jpeg",
        }
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const image = response.generatedImages[0];
        if (image.image && image.image.imageBytes) {
          imageBuffer = Buffer.from(image.image.imageBytes, 'base64');
        }
      }
    }

    // Common: Save the buffer if we have one
    if (imageBuffer) {
      const filename = `image_${index + 1}_${Date.now()}.jpg`;
      const filepath = path.join(outputDir, filename);
      
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(filepath, imageBuffer);
      
      return filepath;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to generate image ${index + 1} with model ${imageModel}:`, error);
    return null;
  }
}
