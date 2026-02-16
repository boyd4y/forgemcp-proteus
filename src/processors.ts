import path from "path";
import { ProteusContext } from "./types";
import { loadTemplate, renderTemplate } from "./core";

export function parseOutlineText(text: string): any[] {
  const pages = text.split(/<page>/i);
  const outlineData: any[] = [];

  pages.forEach((page, index) => {
    const trimmedPage = page.trim();
    if (!trimmedPage) return;

    let type = "content";
    if (trimmedPage.includes("[封面]")) type = "cover";
    else if (trimmedPage.includes("[总结]")) type = "summary";

    const titleMatch = trimmedPage.match(/(?:标题|Title|主题)：(.*?)(?:\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : `Page ${index + 1}`;

    const imageMatch = trimmedPage.match(/(?:配图建议|背景|Image Suggestion|Background)：(.*?)(?:\n|$)/);
    const imageSuggestion = imageMatch ? imageMatch[1].trim() : "";

    outlineData.push({
      page_num: index + 1,
      type,
      title,
      main_content: trimmedPage,
      image_suggestion: imageSuggestion || trimmedPage.slice(0, 100)
    });
  });

  return outlineData;
}

export async function generateImagePromptsFromOutline(context: ProteusContext): Promise<string[]> {
  const { outline, topic } = context;
  if (!outline || !Array.isArray(outline)) return [];

  const imageTemplate = await loadTemplate(context.templateBaseDir ? path.join(context.templateBaseDir, "image_prompts.j2") : "image_prompts.j2");
  const imagePrompts: string[] = [];

  for (const page of outline) {
    const prompt = renderTemplate(imageTemplate, {
      page_content: page.main_content,
      page_type: page.type,
      topic,
      outline_json: JSON.stringify(outline, null, 2)
    });
    imagePrompts.push(prompt);
  }
  return imagePrompts;
}

// Registry of available processors for "transform" steps in JSON configs
export const PROCESSORS: Record<string, (context: ProteusContext) => Promise<any> | any> = {
  "parseOutlineText": (ctx) => parseOutlineText(ctx.outlineRaw),
  "generateImagePromptsFromOutline": generateImagePromptsFromOutline,
  "stringifyOutline": (ctx) => JSON.stringify(ctx.outline, null, 2),
  "extractWechatImagePrompt": (ctx) => {
    if (ctx.contentData && ctx.contentData.image_prompt) {
      return [ctx.contentData.image_prompt];
    }
    return [];
  }
};
