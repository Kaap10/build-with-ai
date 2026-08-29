# Contributing to build-with-ai

Thank you for your interest in contributing to **`build-with-ai`**! We are building a community-driven, zero-API tool to help developers turn software ideas into reality. Every contribution matters — whether it is a new project workflow template, a prompt engineering refinement, a bug fix, or documentation improvements.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [How to Add a New Workflow Template](#how-to-add-a-new-workflow-template)
- [Template Schema Reference](#template-schema-reference)
- [Reporting Bugs & Feature Requests](#reporting-bugs--feature-requests)
- [Good First Issues](#good-first-issues)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior via GitHub private security advisories or issue reports.

---

## Ways to Contribute

You don't have to write CLI core code to make an impact. Here are key ways you can contribute:

| Contribution Area | Description |
| :--- | :--- |
| **New Workflow Templates** | Create step-by-step guides for stacks like Flutter, Discord bots, Django, Electron, or SvelteKit in `templates/*.json`. |
| **Prompt Engineering** | Refine prompt text in existing templates to produce better, cleaner AI code. |
| **CLI & Engine Features** | Add new commands, improve terminal UI/formatting, or enhance error handling. |
| **Testing & Edge Cases** | Add tests covering new platforms, non-TTY environments, or edge cases in `tests/`. |
| **Documentation & Guides** | Fix typos, improve explanations, add examples, or write tutorials. |

---

## Local Development Setup

### 1. Fork and Clone the Repository

```bash
git clone https://github.com/<your-username>/build-with-ai.git
cd build-with-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Test Suites

```bash
# Run unit & integration tests
npm test

# Run end-to-end beginner CLI simulation
npm run test:e2e

# Run all test suites
npm run test:all
```

### 4. Link CLI Globally for Local Testing

```bash
npm link
build-with-ai
```

---

## Project Structure

```text
build-with-ai/
├── bin/
│   └── cli.js              # Commander CLI entrypoint & interactive subcommands
├── lib/
│   ├── init.js             # Interactive onboarding wizard
│   ├── state.js            # .buildwithai/ storage manager (state, context, history)
│   ├── promptEngine.js     # Template loader, regex placeholder resolver, prerequisite checker
│   ├── contextBuilder.js   # Dot-notation getter/setter & Markdown serializer
│   ├── clipboard.js        # Cross-platform clipboard helper with safe fallbacks
│   ├── export.js           # Deterministic README.md, BUILD_LOG.md, CONTEXT.md generator
│   ├── resume.js           # Welcome-back dashboard
│   ├── ui.js               # Visual progress bars, step banners, and ANSI styling
│   └── logger.js           # Colorized terminal logging helper
├── templates/
│   ├── web-app.json        # 23-step Full-Stack Web App workflow
│   ├── saas-mvp.json       # 15-step Modern SaaS MVP workflow
│   ├── rest-api.json       # 10-step Backend REST API workflow
│   ├── mobile-app.json     # 15-step React Native + Expo workflow
│   ├── chrome-extension.json # 12-step Chrome Browser Extension workflow
│   └── ai-agent.json       # 14-step AI Agent & RAG Pipeline workflow
├── tests/
│   ├── test-flow.js        # Comprehensive unit & integration test suite
│   └── e2e-test.js         # End-to-end interactive terminal simulation
├── .github/
│   ├── workflows/ci.yml    # Multi-OS (Ubuntu, macOS, Windows) CI matrix
│   └── ISSUE_TEMPLATE/     # Issue & feature request templates
├── CHANGELOG.md            # Semantic version release log
├── CODE_OF_CONDUCT.md      # Contributor Covenant Code of Conduct
├── SECURITY.md             # Vulnerability disclosure policy
├── README.md               # Main repository documentation
└── package.json            # Package metadata and scripts
```

---

## Submitting a Pull Request

1. Create a new topic branch from `main`:
   ```bash
   git checkout -b feat/my-new-template
   ```
2. Make your changes and ensure all automated tests pass:
   ```bash
   npm run test:all
   ```
3. Commit using clean, descriptive commit messages:
   ```bash
   git commit -m "feat(templates): add flutter-app workflow template"
   ```
4. Push to your fork and open a Pull Request against the `main` branch.
5. Complete the PR checklist provided in the pull request template.

---

## How to Add a New Workflow Template

Contributing a new template is the fastest way to expand the tool's reach.

### Requested Community Templates
- `flutter-app.json` — Flutter + Dart + Supabase
- `discord-bot.json` — Discord.js + TypeScript + Slash Commands
- `django-api.json` — Python + Django + PostgreSQL + Celery
- `electron-desktop.json` — Electron + React + Vite
- `browser-game.json` — HTML5 Canvas + Phaser.js

### Template Authoring Checklist
1. Create a new file in `templates/` named `<your-template-id>.json`.
2. Follow the [Template Schema Reference](#template-schema-reference) below.
3. Include 10-20 sequential steps covering the full software lifecycle (Discovery $\rightarrow$ Architecture $\rightarrow$ Scaffolding $\rightarrow$ Core Features $\rightarrow$ Testing $\rightarrow$ Deployment).
4. Run `npx build-with-ai list` to verify your template is loaded with the correct step count.
5. Test initializing a project with your template:
   ```bash
   npx build-with-ai init --template ./templates/<your-template-id>.json
   ```

---

## Template Schema Reference

Every template in `templates/*.json` conforms to this JSON structure:

```json
{
  "type": "unique-template-id",
  "title": "Human Readable Title",
  "description": "One-line summary of what this workflow guides the developer through.",
  "steps": [
    {
      "id": "step-01-identifier",
      "phase": "Discovery | Architecture | Database | Setup | Frontend | Testing | Security | Deployment",
      "title": "Short Step Title",
      "goal": "Explains why this step matters and what outcome is achieved.",
      "requires": ["project.name", "project.idea"],
      "writes": ["decisions.targetAudience", "decisions.coreValueProp"],
      "expectedOutput": "What the AI should produce when given this prompt.",
      "recommendedAI": "Claude 3.5 Sonnet / GPT-4o",
      "targetFiles": ["prisma/schema.prisma", "src/lib/db.ts"],
      "prompt": "Prompt text containing {{project.name}} or {{decisions.database}} placeholders."
    }
  ]
}
```

### Available Placeholders

You can use these placeholders anywhere inside the `prompt` string:

| Placeholder | Injected Value |
| :--- | :--- |
| `{{project.name}}` | Project name entered during `init` |
| `{{project.idea}}` | One-line project idea entered during `init` |
| `{{project.experienceLevel}}` | Experience level (`Beginner`, `Intermediate`, `Experienced`) |
| `{{project.type}}` | The active template ID |
| `{{decisions.<key>}}` | Any decision recorded in `context.json` from earlier steps |

---

## Reporting Bugs & Feature Requests

- **Bug Reports:** Open an issue using our [Bug Report Template](https://github.com/Kaap10/build-with-ai/issues/new?template=bug_report.md).
- **Feature Requests:** Suggest ideas via our [Feature Request Template](https://github.com/Kaap10/build-with-ai/issues/new?template=feature_request.md).
- **Template Proposals:** Propose new workflows via the [Template Proposal Template](https://github.com/Kaap10/build-with-ai/issues/new?template=template_proposal.md).

---

## Good First Issues

Looking for an easy entry point?
- Refine wording or add missing `targetFiles` / `recommendedAI` to existing templates.
- Write a new specialized template for your favorite programming framework.
- Add test coverage for new edge cases in `tests/`.

Look for issues tagged `good first issue` on GitHub!
