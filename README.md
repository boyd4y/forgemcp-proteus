# @forgemcp/proteus

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@forgemcp/proteus.svg)](https://www.npmjs.com/package/@forgemcp/proteus)

**Proteus** is a universal, configuration-driven content generation engine powered by Google Gemini. It allows you to define flexible workflows ("templates") to generate text, structured data, and images for any platform (Xiaohongshu, WeChat, Twitter, Email, etc.) without writing code.

> **Why Proteus?**
> Named after the shapeshifting Greek sea god, Proteus adapts to any content structure you define. Whether you need a 3-stage visual pipeline or a simple text generator, Proteus handles the flow.

## ✨ Features

- **🧩 Template System**: Configurable generation pipelines via `proteus.json`.
- **🖼️ Auto-Visuals**: Integrated AI image generation (Imagen 3 / Gemini Pro Vision).
- **🧠 Chain Engine**: Supports complex flows (e.g., Outline -> Visuals -> Content).
- **⚡️ Fast & Cheap**: Optimized for `gemini-2.0-flash` by default.
- **☁️ Unified Auth**: Works with **Google AI Studio** (API Key) and **Vertex AI** out of the box.

## 📦 Installation

```bash
# Using npm
npm install @forgemcp/proteus

# Using bun
bun add @forgemcp/proteus
```

## 🚀 Usage

### 1. As a CLI Tool

You can run it directly via `bun` or `node`:

```bash
# Initialize a config file
bun run cli.ts init

# Run with default template (RedNote style)
bun run cli.ts "Spring Outfit Ideas" "Casual" --template rednote-standard --generate-images

# Run with custom template
bun run cli.ts "Weekend Hike" "Casual" --template wechat-moments
```

### 2. As a Library (Node.js/TypeScript)

```typescript
import { generateContent } from "@forgemcp/proteus";

const result = await generateContent({
  topic: "Hidden Gem Cafes in Tokyo",
  style: "Emotional",
  imageCount: 5,
  apiKey: process.env.GEMINI_API_KEY,
  template: "rednote-standard"
});

if (result.ok) {
  console.log(result.data);
}
```

## 📚 Scenarios

### 1. Xiaohongshu: Food Guide (e.g., Crayfish)
Generate a viral food review with structured outline and visual prompts.
```bash
bun run cli.ts "Spicy Crayfish Night 🦞" "Emotional" --template rednote-standard
```

### 2. WeChat Moments: Life Update
Generate a short, punchy caption with a single image prompt.
```bash
bun run cli.ts "Friday Night Vibes" "Casual" --template wechat-moments
```

## 🛠️ Configuration (proteus.json)

Proteus looks for `proteus.json` in the current directory or `~/.config/proteus/`.

Example `proteus.json` defining a simple workflow:

```json
{
  "templates": {
    "simple-tweet": {
      "id": "simple-tweet",
      "steps": [
        {
          "id": "gen_text",
          "type": "generate_text",
          "name": "Generate Tweet",
          "template": "tweet.j2",
          "outputKey": "content"
        }
      ]
    }
  }
}
```

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | API Key from Google AI Studio | Yes (or Vertex) |
| `GEMINI_MODEL` | Model ID (e.g., `gemini-2.0-flash`) | No (Default: `gemini-2.0-flash`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Service Account JSON | Optional (For Vertex AI Auth) |

## 📄 License

MIT © [ForgeMCP](https://www.forgemcp.cc)
