import fs from "fs/promises";
import path from "path";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

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

export async function readImage(filePath: string): Promise<{ mimeType: string; data: string }> {
  try {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const data = await fs.readFile(filePath, { encoding: 'base64' });
    return { mimeType, data };
  } catch (error) {
    console.error(`Failed to read image at ${filePath}:`, error);
    throw error;
  }
}

// 2. Safe JSON Generation
export async function safeGenerateJSON(client: GoogleGenAI, modelName: string, prompt: string, images?: { mimeType: string; data: string }[]): Promise<any> {
  const parts: any[] = [{ text: prompt }];
  
  if (images && images.length > 0) {
    for (const img of images) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }
  }

  const response = await client.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts }],
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
export async function generateImage(client: GoogleGenAI, imageModel: string, prompt: string, outputDir: string, index: number, referenceImages?: { mimeType: string; data: string }[]): Promise<string | null> {
  try {
    let imageBuffer: Buffer | null = null;

    // Strategy 1: Gemini Models (generateContent)
    // e.g. gemini-2.0-flash
    if (imageModel.toLowerCase().startsWith("gemini")) {
      const parts: any[] = [];
      if (referenceImages && referenceImages.length > 0) {
        for (const img of referenceImages) {
          parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
        }
      }
      parts.push({ text: prompt });

      const response = await client.models.generateContent({
        model: imageModel,
        contents: [{ parts }],
        config: {
          responseModalities: ["IMAGE"],
        }
      });

      // Parse Gemini response for inline image data
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0];
        const parts = candidate.content?.parts;
        
        if (parts) {
          // Look for part with inlineData
          const imagePart = parts.find((part: any) => part.inlineData && part.inlineData.data);
          if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
            imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
          } else {
             console.warn(`[Proteus] Model '${imageModel}' returned candidates but no image inlineData found.`);
             console.warn(`[Proteus] Candidates count: ${candidates.length}`);
             console.warn(`[Proteus] Finish Reason: ${candidate.finishReason}`);
             console.warn(`[Proteus] Finish Message: ${candidate.finishMessage}`);
             
             const textPart = parts.find((part: any) => part.text);
             if (textPart) {
                 console.warn(`[Proteus] Response Text: "${textPart.text}"`);
             }
          }
        } else {
           console.warn(`[Proteus] Model '${imageModel}' returned candidates but no content parts.`);
           console.warn(`[Proteus] Finish Reason: ${candidate.finishReason}`);
           console.warn(`[Proteus] Finish Message: ${candidate.finishMessage}`);
        }
      } else {
         console.warn(`[Proteus] Model '${imageModel}' returned no candidates.`);
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
        } else {
           console.warn(`[Proteus] Imagen model '${imageModel}' returned generatedImages but no imageBytes.`);
        }
      } else {
         console.warn(`[Proteus] Imagen model '${imageModel}' returned no generatedImages.`);
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
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.warn(`[Proteus] Failed to generate image ${index + 1} with model ${imageModel}: ${errorMsg}`);
    return null;
  }
}
