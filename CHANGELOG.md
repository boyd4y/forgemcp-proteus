# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-14

### Added
- Rebranded to `@forgemcp/proteus`.
- **Template System**: Configurable generation pipelines via `proteus.json`.
- **Multi-Platform Support**: Added example template for WeChat Moments.
- Initial release of `@forgemcp/redimage` (Legacy).
- **3-Stage Generation Pipeline**: Outline -> Visuals -> Content.
- **Multi-Model Support**: Configurable Gemini models (default: `gemini-2.0-flash`).
- **Zero-Config Auth**: Support for both Google AI Studio (API Key) and Vertex AI (ADC).
- **Templates**: Jinja2 templates for structured outlines, image prompts, and viral copy.
- **CLI**: Built-in CLI wrapper for direct execution.
- **Pure Skill Architecture**: Dependency-free implementation (removed legacy plugin dependencies).
