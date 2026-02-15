import { describe, expect, it, mock } from "bun:test";
import { generateContent } from "../src/index";

mock.module("@google/genai", () => {
  return {
    GoogleGenAI: class {
      constructor(config: any) {
        if (!config.apiKey && !process.env.GEMINI_API_KEY) {
          // throw new Error("Missing API Key"); // Removed strictly for mock context to allow flexible testing
        }
      }
      models = {
        generateContent: async (params: any) => {
          const prompt = params.contents[0].parts[0].text;
          
          // MOCK IMAGE GENERATION (Gemini)
          if (params.config?.responseModalities?.includes("IMAGE")) {
             return {
               candidates: [{
                 content: {
                   parts: [{
                     inlineData: {
                       mimeType: "image/jpeg",
                       data: "dGVzdF9pbWFnZV9kYXRh" // base64 for "test_image_data"
                     }
                   }]
                 }
               }]
             };
          }

          let responseText = "{}";

          if (prompt.includes("生成一个适合小红书的图文内容大纲")) {
             responseText = `[封面]
标题：Test Cover
副标题：Sub
背景：Visual 1
<page>
[内容]
标题：Test Step 1
内容：Step 1
配图建议：Visual 2
<page>
[总结]
标题：Test Summary
内容：Outro
配图建议：Visual 3`;
          } else if (prompt.includes("image prompts")) {
             responseText = JSON.stringify([
                "masterpiece, visual 1",
                "masterpiece, visual 2", 
                "masterpiece, visual 3"
              ]);
          } else if (prompt.includes("生成适合小红书发布的标题、文案和标签")) {
             responseText = JSON.stringify({
                titles: ["Title 1", "Title 2"],
                copywriting: "Full content...",
                tags: ["tag1"]
              });
          }

          return { 
            text: responseText,
          };
        }
      }
    }
  };
});

describe("Proteus Generator", () => {
  it("should generate full content pipeline successfully", async () => {
    const result = await generateContent({
      topic: "Unit Test Topic",
      style: "Casual",
      imageCount: 4,
      apiKey: "dummy_key",
      generateImages: false
    });

    expect(result.ok).toBe(true);
    if (!result.ok) console.error(result.error);
    if (result.ok && result.data) {
        expect(result.data.best_title).toBe("Title 1");
        expect(result.data.title).toBe("Title 1");
        expect(result.data.content).toBe("Full content...");
        expect(result.data.outline.length).toBe(3);
        expect(result.data.imagePrompts.length).toBe(3);
    }
  });

  it("should fail gracefully on invalid input", async () => {
    const result = await generateContent({
      topic: "",
      style: "Casual",
      imageCount: 4,
      generateImages: false
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_INPUT");
  });

  it("should use generateContent for Gemini Image models", async () => {
    const result = await generateContent({
      topic: "Gemini Image Test",
      style: "Casual",
      imageCount: 3,
      apiKey: "dummy_key",
      generateImages: true,
      imageModel: "gemini-3.0-image-preview" // Triggers the new path
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
        expect(result.data.generatedImages).toBeDefined();
        expect(result.data.generatedImages?.length).toBeGreaterThan(0);
    }
  });
});
