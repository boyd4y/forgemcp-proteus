import fs from "fs";
import path from "path";
import os from "os";
import { Template } from "./types";

const CONFIG_FILE_NAME = "proteus.json";

function getConfigFilePaths(): string[] {
  return [
    path.join(process.cwd(), CONFIG_FILE_NAME),
    path.join(os.homedir(), ".config", "proteus", CONFIG_FILE_NAME),
    path.join(os.homedir(), ".proteus", CONFIG_FILE_NAME),
  ];
}

function scanTemplatesDir(): Record<string, Template> {
  const templates: Record<string, Template> = {};
  const templatesDir = path.join(process.cwd(), "templates");

  if (!fs.existsSync(templatesDir)) {
    return templates;
  }

  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const configPath = path.join(templatesDir, entry.name, CONFIG_FILE_NAME);
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, "utf-8");
          const config = JSON.parse(content);
          
          // Use folder name as ID if not specified, or just trust the config
          const templateId = config.id || entry.name;
          
          templates[templateId] = {
            ...config,
            id: templateId,
            baseDir: path.join(templatesDir, entry.name)
          };
          console.log(`Loaded template '${templateId}' from ${entry.name}`);
        } catch (error) {
          console.warn(`Failed to load template from ${entry.name}:`, error);
        }
      }
    }
  }
  return templates;
}

export function loadTemplates(): Record<string, Template> {
  // 1. Scan templates/ directory
  let templates = scanTemplatesDir();
  
  // 2. Load global/user config overrides
  for (const filePath of getConfigFilePaths()) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const userConfig = JSON.parse(fileContent);
        if (userConfig.templates) {
          console.log(`Loading extra templates from ${filePath}`);
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
    // Generate a starter config file
    const config = {
        templates: {} 
    };
    
    fs.writeFileSync(targetPath, JSON.stringify(config, null, 2));
    console.log(`Config saved to ${targetPath}`);
}
