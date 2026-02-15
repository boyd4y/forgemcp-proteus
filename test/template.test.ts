import { describe, expect, it, mock } from "bun:test";
import { executeTemplate } from "../src/engine";
import { BUILTIN_TEMPLATES } from "../src/registry";
import { ProteusInput } from "../src/config";

// Mock GoogleGenAI
const mockGenerateContent = mock(async (params: any) => {
  const prompt = params.contents[0].parts[0].text;
  
  if (prompt.includes("outline")) {
    return {
      text: () => `[封面]\n标题：Test Cover\n<page>\n[内容]\n标题：Page 1\n内容：Content 1`
    };
  } else if (prompt.includes("content")) { // Simple check for content template
    return {
      text: () => JSON.stringify({
        titles: ["Mock Title"],
        copywriting: "Mock Content",
        tags: ["Mock Tag"]
      })
    };
  }
  
  return { text: () => "{}" };
});

const mockClient = {
  models: {
    generateContent: mockGenerateContent
  }
} as any;

describe("Template Engine", () => {
  it("should execute 'rednote-standard' template", async () => {
    const template = BUILTIN_TEMPLATES["rednote-standard"];
    const input: ProteusInput = {
      topic: "Test Topic",
      style: "Casual",
      imageCount: 3,
      generateImages: false,
      template: "rednote-standard"
    };

    const context = await executeTemplate(mockClient, template, input);

    expect(context.outlineRaw).toBeDefined();
    expect(context.outline).toBeDefined();
    expect(Array.isArray(context.outline)).toBe(true);
    
    // Check content generation
    expect(context.contentData).toBeDefined();
    expect(context.contentData.titles[0]).toBe("Mock Title");
  });
});
