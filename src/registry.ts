import fs from "fs";
import path from "path";
import os from "os";
import { Template } from "./types";
import { parseOutlineText, generateImagePromptsFromOutline } from "./processors";

export const BUILTIN_TEMPLATES: Record<string, Template> = {
  "rednote-standard": {
    id: "rednote-standard",
    description: "Standard 3-stage RedNote generation (Outline -> Images -> Content)",
    steps: [
      {
        id: "generate_outline",
        type: "generate_text",
        name: "Generate Outline",
        template: "outline.j2",
        outputKey: "outlineRaw",
        inputMapping: {
          topic: "topic",
          style: "style",
          imageCount: "imageCount"
        }
      },
      {
        id: "parse_outline",
        type: "transform",
        name: "Parse Outline",
        handlerId: "parseOutlineText",
        outputKey: "outline"
      },
      {
        id: "generate_prompts",
        type: "transform",
        name: "Generate Image Prompts",
        handlerId: "generateImagePromptsFromOutline",
        outputKey: "imagePrompts"
      },
      {
        id: "generate_images",
        type: "generate_images",
        name: "Generate Images",
        promptSourceKey: "imagePrompts",
        condition: (ctx) => (ctx.generateImages || false)
      },
      {
        id: "prepare_content_input",
        type: "transform",
        name: "Stringify Outline",
        handlerId: "stringifyOutline",
        outputKey: "outline_json"
      },
      {
        id: "generate_content",
        type: "generate_json",
        name: "Generate Content",
        template: "content.j2",
        outputKey: "contentData",
        inputMapping: {
          topic: "topic",
          style: "style",
          outline_json: "outline_json"
        }
      }
    ]
  },
  "wechat-moments": {
    id: "wechat-moments",
    description: "Simple 2-step workflow for WeChat Moments (Text + 1 Image)",
    steps: [
      {
        id: "generate_content_and_prompt",
        type: "generate_json",
        name: "Generate Text & Prompt",
        template: "wechat.j2",
        outputKey: "contentData", 
        inputMapping: {
          topic: "topic",
          style: "style"
        }
      },
      {
        id: "prepare_image_prompt",
        type: "transform",
        name: "Extract Image Prompt",
        handlerId: "extractWechatImagePrompt",
        outputKey: "imagePrompts"
      },
      {
        id: "generate_image",
        type: "generate_images",
        name: "Generate Image",
        promptSourceKey: "imagePrompts",
        condition: (ctx) => (ctx.imagePrompts && ctx.imagePrompts.length > 0) || false
      }
    ]
  }
};

const CONFIG_FILE_NAME = "proteus.json";

function getConfigFilePaths(): string[] {
  return [
    path.join(process.cwd(), CONFIG_FILE_NAME),
    path.join(os.homedir(), ".config", "proteus", CONFIG_FILE_NAME),
    path.join(os.homedir(), ".proteus", CONFIG_FILE_NAME),
  ];
}

export function loadTemplates(): Record<string, Template> {
  let templates = { ...BUILTIN_TEMPLATES };
  
  for (const filePath of getConfigFilePaths()) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const userConfig = JSON.parse(fileContent);
        if (userConfig.templates) {
          console.log(`Loading templates from ${filePath}`);
          // Merge user templates, overriding built-ins if ID matches
          templates = { ...templates, ...userConfig.templates };
        }
      } catch (error) {
        console.warn(`Failed to load config from ${filePath}:`, error);
      }
    }
  }
  
  return templates;
}

export function getTemplate(id: string): Template {
  const allTemplates = loadTemplates();
  const t = allTemplates[id];
  if (!t) {
    throw new Error(`Template '${id}' not found. Available: ${Object.keys(allTemplates).join(", ")}`);
  }
  return t;
}

export function saveConfigFile(targetPath: string) {
    const config = {
        templates: BUILTIN_TEMPLATES
    };
    
    // Remove functions (condition, handler) from JSON output to ensure validity
    // handlerId strings are preserved
    const jsonString = JSON.stringify(config, (key, value) => {
        if (typeof value === 'function') {
            return undefined;
        }
        return value;
    }, 2);
    
    fs.writeFileSync(targetPath, jsonString);
    console.log(`Config saved to ${targetPath}`);
}
