---
name: @forgemcp/proteus
description: Universal content generation engine (Proteus) - Create content for RedNote, WeChat, Twitter, etc.
version: 1.0.0
author: ForgeMCP
license: MIT
requires:
  node: ">=18"
  env: ["GEMINI_API_KEY"]
  bins: ["bun"]
metadata:

  clawdbot:
    permissions:
      network: ["generativelanguage.googleapis.com"]
      filesystem: ["read:./templates"]
    user-invocable: true
    risk: low

examples:
  - "Create a Xiaohongshu post about a cozy cafe in Shanghai"
  - 'bun cli.ts "Summer outfit ideas" "Casual"'
---


## Security Manifest

### External Endpoints
This skill connects to the following external services:
-   `generativelanguage.googleapis.com` (Google Gemini API): For generating text and images.

### Data Flow
1.  User input (topic, style) is sent to Google Gemini via the `@google/genai` SDK.
2.  Generated content is processed locally.
3.  No user data is stored persistently by this skill outside of the current session execution.

### Trust Declaration
By installing this skill, you trust:
-   **Google AI**: To process your prompts and generate content.
-   **ForgeMCP**: As the author of this orchestration logic.

## Core Functionality

Generates high-quality Xiaohongshu (RedNote) posts including:
1.  **Viral Title**: Catchy, emoji-rich titles optimized for clicks.
2.  **Engaging Content**: Structured body text with tags, emojis, and emotional hooks.
3.  **Image Prompts**: Detailed prompts for generating matching visuals (or direct generation if configured).

Solves the pain point of writer's block and time-consuming content creation for social media marketing.

## Usage

### Natural Language
- "Help me write a RedNote post about [Topic]"
- "Generate a Xiaohongshu guide for [Topic] with [Style]"

### Invocation
The agent should invoke this tool directly using `bun`. Dependencies are automatically handled by Bun on the first run:

```bash
bun cli.ts "Topic" "Style" --flag value
```

Examples:
- `bun cli.ts "Summer Outfit" "Casual"`
- `bun cli.ts "Weekend Hike" "Emotional" --generate-images` 

## Input Schema (Zod)

```typescript
import { z } from "zod";

const InputSchema = z.object({
  topic: z.string().min(1).describe("The main topic of the post"),
  style: z.enum(["Casual", "Professional", "Emotional", "Educational"]).default("Casual").describe("Tone and style of the content"),
  template: z.string().optional().describe("Template to use (e.g., rednote-standard, wechat-moments)"),
  imageCount: z.number().min(1).max(9).default(4).describe("Number of image prompts to generate"),
  imageModel: z.string().optional().describe("Model for image generation (e.g., imagen-3)"),
  model: z.string().optional().describe("Gemini model to use (default: gemini-2.0-flash)"),
  apiKey: z.string().optional().describe("Optional API key to override environment variable"),
  generateImages: z.boolean().default(false).describe("Whether to generate actual images"),
});
```

## Output Format

### Success (JSON)
```json
{
  "ok": true,
  "data": {
    "title": "✨Hidden Gem! This Cafe in Shanghai is a Must-Visit ☕️",
    "content": "Found this amazing spot on Wukang Road... [Full Content]",
    "tags": ["#ShanghaiCafe", "#WeekendVibes", "#CoffeeLover"],
    "imagePrompts": [
      "A cozy cafe interior with warm lighting and wooden furniture, photorealistic, 4k",
      "Close up of a latte with latte art on a marble table"
    ]
  },
  "summary": "Generated a post about 'Shanghai Cafe' with 2 image prompts."
}
```

### Failure (JSON)
```json
{
  "ok": false,
  "error": "Failed to generate content: API key invalid",
  "code": "API_ERROR"
}
```

## Best Practices

-   **Topic Specificity**: The more specific the topic, the better the result.
-   **Style Matching**: Choose a style that fits the target audience.
-   **Review**: Always review generated content for accuracy before posting.
