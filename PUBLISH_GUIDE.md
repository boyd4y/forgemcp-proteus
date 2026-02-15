# ClawHub Publishing Guide

## Core Metadata Configuration
- **clawdbot vs openclaw**: Use `clawdbot` for automated bots and `openclaw` for community-driven skills.
- **env vs envs**: `env` is for single environment variables, `envs` is for multiple.
- **files**: Ensure all necessary files are included in the `files` array in `package.json`.

## Security Manifest Requirements
- All skills must include a `security.json` manifest.
- Define permissions clearly (network, filesystem, etc.).

## VirusTotal Integration
- All binaries and scripts are scanned via VirusTotal.
- Ensure no false positives before submission.

## GitHub Account Limits
- Rate limits apply to GitHub API calls.
- Use authenticated requests where possible.

## Best Practice Checklist
- [ ] Valid `SKILL.md`
- [ ] Security manifest included
- [ ] No hardcoded secrets
- [ ] Documentation updated
