# Changelog

All notable changes to `build-with-ai` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-08-29

### Added
- **New CLI Commands:**
  - `build-with-ai context [key]`: Inspect all recorded decisions or look up a specific dot-notation key.
  - `build-with-ai set <key> <value>`: Modify any decision directly in `context.json` on the fly.
  - `build-with-ai jump [stepNumber]`: Jump directly to any step number with an interactive step picker fallback.
  - `build-with-ai next --raw`: Output only the prompt string for piping directly into other CLI utilities or scripts.
  - `build-with-ai next --json`: Output structured JSON data of the active step.
- **Enhanced Step Banners:**
  - Added `PHASE`, `RECOMMENDED AI`, and `TARGET FILES` fields to step displays for clearer developer guidance.
- **Custom Template Loading:**
  - Added `--template <path-or-url>` flag to `init` command, supporting local `.json` files and remote HTTPS URLs.
- **4 New Workflow Templates:**
  - `saas-mvp.json` (15 steps): Modern SaaS with Next.js 14, Supabase, Stripe, and Resend.
  - `mobile-app.json` (15 steps): Cross-platform mobile development with React Native, Expo Router, and EAS Build.
  - `chrome-extension.json` (12 steps): Browser extensions using Manifest V3, Vite, and React.
  - `ai-agent.json` (14 steps): AI Agent & RAG Pipeline with LangChain, vector databases, and FastAPI/Express.
- **Open Source Governance:**
  - Added GitHub Actions CI multi-OS testing matrix (`ubuntu`, `macos`, `windows`).
  - Added issue templates, PR template, Dependabot, Code of Conduct, and Security policy.

### Changed
- Upgraded root interactive menu to include `context` and `jump` quick actions.
- Enriched `web-app.json` (23 steps) and `rest-api.json` (10 steps) with `targetFiles` and `recommendedAI` metadata.

---

## [1.0.2] - 2026-08-25

### Changed
- Packaging and documentation polish for npm publication readiness.
- Fixed clipboard fallback handler to support both ESM and CommonJS exports.
- Stripped extraneous logging and emojis for cleaner terminal display.

---

## [1.0.0] - 2026-08-25

### Added
- Initial release of `build-with-ai`.
- Zero-API, local-first workflow engine.
- 10 core commands: `init`, `next`, `done`, `back`, `status`, `resume`, `export`, `list`, `reset`, and root interactive launcher.
- Automatic context injection with dot-notation placeholders (`{{decisions.database}}`).
- Full-Stack Web App (`web-app.json`) and Backend REST API (`rest-api.json`) templates.
- Markdown documentation generator (`export` for `README.md`, `BUILD_LOG.md`, `CONTEXT.md`).

