# OpenClaw Skill - Proteus Content Engine

This repository contains an OpenClaw skill (pure Node.js) for generating high-quality content for various platforms (RedNote, WeChat, Twitter, etc.) using Google Gemini.

## Core Features

- **Template-Based Engine**: Configurable workflows via `proteus.json` (e.g., `rednote-standard`, `wechat-moments`).
- **Chain Execution**: Supports complex pipelines like "Outline -> Visuals -> Copy".
- **Auto-Visuals**: Integrated AI image generation (Imagen 3 / Gemini Pro Vision).
- **Auto-Visuals**: Generates matching AI image prompts for each page of the post.
- **Unified Backend**: Supports both Gemini API (AI Studio) and Vertex AI via `@google/genai` SDK.

## Directory Structure

- `src/index.ts`: Main logic (pure Node.js, no framework dependencies).
- `cli.ts`: CLI entry point.
- `templates/`: Jinja2/Nunjucks templates for prompts.
- `test/`: Unit tests (Bun test runner).

## Development Guide

### Setup
- Install dependencies: `bun install`

### Authentication (Zero-Config)
The tool uses the unified `@google/genai` SDK which auto-detects credentials in this priority:
1.  **API Key**: `GEMINI_API_KEY` (AI Studio).
2.  **Service Account**: `GOOGLE_APPLICATION_CREDENTIALS` (JSON file path).
3.  **Vertex AI**: `GOOGLE_CLOUD_PROJECT` + `GOOGLE_CLOUD_LOCATION` (ADC).

### Configuration
- **Model Selection**: Set `GEMINI_MODEL` env var (default: `gemini-2.0-flash`) or pass `model` argument.

### Running Tools
CLI wrapper:
```bash
bun run cli.ts "Summer Outfit Ideas" "Casual" --template rednote-standard --generate-images
```

Run tests:
```bash
bun test
```

### Skill Integration
This skill exports a pure async function `generateContent(input)` that returns a JSON object.
It does not depend on any specific agent framework runtime, making it portable.

## Publishing
For guidelines on publishing this skill to ClawHub, see [PUBLISH_GUIDE.md](./PUBLISH_GUIDE.md).
