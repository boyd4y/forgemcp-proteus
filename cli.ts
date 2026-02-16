#!/usr/bin/env bun
import { Command } from "commander";
import { generateContent } from "./src/index";
import { saveConfigFile } from "./src/registry";
import pkg from "./package.json";

// Export for library usage
export default generateContent;

// Simple CLI runner if executed directly
if ((import.meta as any).main) {
  const program = new Command();

  program
    .name("proteus")
    .description("OpenClaw Skill - Proteus Content Engine")
    .version(pkg.version);

  program
    .command("init")
    .description("Generate proteus.json config file")
    .action(() => {
      saveConfigFile("proteus.json");
      process.exit(0);
    });

  // Explicitly add help command to ensure it works despite root arguments
  program.addHelpCommand("help [command]", "Display help for command");

  program
    .argument("[topic]", "The main topic of the post")
    .argument("[style]", "Tone and style")
    .option("-t, --topic <string>", "The main topic of the post")
    .option("-s, --style <string>", "Tone and style")
    .option("--template <string>", "Template to use (e.g., rednote-standard)")
    .option("--image-count <number>", "Number of images to generate", (value) => parseInt(value, 10))
    .option("--generate-images", "Whether to generate actual images")
    .action(async (topicArg, styleArg, options) => {
      const topic = options.topic || topicArg;
      const style = options.style || styleArg || "Casual";

      if (!options.template) {
        console.error("Error: --template is mandatory");
        process.exit(1);
      }

      if (!topic) {
        program.help();
      }

      try {
        const result = await generateContent({
          topic,
          style: style as any,
          ...options,
        });
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}
