---
name: @forgemcp/proteus
description: Universal content generation engine (Proteus) - Create content for RedNote, WeChat, Twitter, etc.
version: 1.0.0
author: ForgeMCP
license: MIT
requires:
  node: ">=18"
  npm: ["@google/genai", "zod"]
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
  - '/proteus --topic "Summer outfit ideas" --style "Casual"'
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

### Slash Command
When installed as an OpenClaw skill, use the `/proteus` command:

```bash
/proteus --topic "My Topic" --style "My Style"
/proteus --topic "My Topic" --generate-images
/proteus --topic "My Topic" --template wechat-moments
```

*Note: The agent invokes this via `bun run cli.ts` internally when running from the source repository.*
## Input Schema (Zod)

```typescript
import { z } from "zod";

const InputSchema = z.object({
  topic: z.string().min(1).describe("The main topic of the post"),
  style: z.enum(["Casual", "Professional", "Emotional", "Educational"]).default("Casual").describe("Tone and style of the content"),
  imageCount: z.number().min(1).max(9).default(4).describe("Number of image prompts to generate"),
  model: z.string().optional().describe("Gemini model to use (default: gemini-2.0-flash)"),
  generateImages: z.boolean().default(false).describe("Whether to generate actual images using Imagen 3 (Vertex AI)"),
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
