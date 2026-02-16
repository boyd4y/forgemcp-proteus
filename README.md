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

#### Local Development (Clone)
If you have cloned the repository, run directly via `bun`:

```bash
# Initialize a config file
bun cli.ts init

# Run with default template (RedNote style)
bun cli.ts "Spring Outfit Ideas" "Casual" --template rednote-standard --generate-images
```

#### Global Usage (npm/bunx)
If you want to use it without cloning, use `bunx`:

```bash
bunx @forgemcp/proteus "Spring Outfit Ideas" "Casual" --template rednote-standard
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

### 1. Xiaohongshu: OpenClaw Agent Intro (Crayfish)
Generate a tech intro comparing the "Claw" agent to a powerful crayfish.
```bash
bun cli.ts "OpenClaw: The Intelligent Crayfish Agent 🦞" "Educational" --template rednote-standard
```

<details>
<summary>View Generated Output Reference</summary>

```json
{
  "ok": true,
  "data": {
    "title": "地表最强AI特工！OpenClaw小龙虾来啦🦞告别重复劳动自动化神具！",
    "content": "宝子们！我真的挖到宝了！如果你还在每天重复点网页、搬运数据，那这个AI黑科技你一定要看！🦞\n\n它是OpenClaw，一个真正拥有“视觉”和“大脑”的超级AI特工！它不只是陪你聊天，而是真的会“动手”帮你干活！✨...",
    "tags": ["AI", "OpenClaw", "人工智能", "生产力工具", "自动化"],
    "outline": [
      {
        "page_num": 1,
        "type": "cover",
        "title": "地表最强AI特工！OpenClaw小龙虾Agent来了🦞",
        "main_content": "[封面]\n标题：地表最强AI特工！OpenClaw小龙虾Agent来了🦞...",
        "image_suggestion": "一只充满科技感、戴着赛博眼镜的小龙虾正在操控多个浮空的虚拟屏幕..."
      }
    ],
    "imagePrompts": [
      "请生成一张小红书风格的图文内容图片。页面内容：[封面]..."
    ],
    "metadata": {
      "model": "gemini-3-flash-preview",
      "style": "Educational",
      "topic": "OpenClaw: The Intelligent Crayfish Agent 🦞",
      "template": "rednote-standard"
    }
  }
}
```
</details>

### 2. WeChat Moments: Life Update
Generate a short, punchy caption with a single image prompt.
```bash
bun cli.ts "Friday Night Vibes" "Casual" --template wechat-moments
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
