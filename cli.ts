#!/usr/bin/env bun
import { generateContent } from "./src/index";
import { saveConfigFile } from "./src/registry";

// Export for library usage
export default generateContent;

// Simple CLI runner if executed directly
if ((import.meta as any).main) {
  const args = process.argv.slice(2);
  
  // Handle commands
  if (args[0] === "init") {
    saveConfigFile("proteus.json");
    process.exit(0);
  }

  const options: any = {};
  const positionals: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--image-count") {
      const val = args[++i];
      if (val === undefined || val.startsWith("--")) {
        console.error("Error: --image-count requires a value");
        process.exit(1);
      }
      options.imageCount = parseInt(val, 10);
    } else if (arg === "--image-model") {
      const val = args[++i];
      if (val === undefined || val.startsWith("--")) {
        console.error("Error: --image-model requires a value");
        process.exit(1);
      }
      options.imageModel = val;
    } else if (arg === "--model") {
      const val = args[++i];
      if (val === undefined || val.startsWith("--")) {
        console.error("Error: --model requires a value");
        process.exit(1);
      }
      options.model = val;
    } else if (arg === "--api-key") {
      const val = args[++i];
      if (val === undefined || val.startsWith("--")) {
        console.error("Error: --api-key requires a value");
        process.exit(1);
      }
      options.apiKey = val;
    } else if (arg === "--generate-images") {
      options.generateImages = true;
    } else if (arg === "--template") {
      const val = args[++i];
      if (val === undefined || val.startsWith("--")) {
        console.error("Error: --template requires a value");
        process.exit(1);
      }
      options.template = val;
    } else if (arg.startsWith("--")) {
      console.error(`Unknown flag: ${arg}`);
      process.exit(1);
    } else {
      positionals.push(arg);
    }
  }

  const topic = positionals[0];
  const style = positionals[1] || "Casual";

  if (!topic) {
    console.error("Usage: bun cli.ts <topic> [style] [flags]");
    console.error("Commands:");
    console.error("  init                  Generate proteus.json config file");
    console.error("Flags:");
    console.error("  --image-count <number>");
    console.error("  --image-model <string>");
    console.error("  --model <string>");
    console.error("  --api-key <string>");
    console.error("  --template <string>");
    console.error("  --generate-images");
    process.exit(1);
  }

  generateContent({
    topic,
    style: style as any,
    ...options
  }).then((result) => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
