# Contributing to build-with-ai

Thank you for your interest in contributing. build-with-ai is an open-source project and every contribution matters — whether it is a bug fix, a new template, an improved prompt, or a documentation update.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [How to Add a New Template](#how-to-add-a-new-template)
- [Template Schema Reference](#template-schema-reference)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Good First Issues](#good-first-issues)

---

## Code of Conduct

Be respectful and constructive. This is a beginner-friendly project. All experience levels are welcome.

---

## Ways to Contribute

You do not need to write code to contribute. Here are the ways you can help:

| Contribution Type | What It Means |
| :--- | :--- |
| **Add a new template** | Create a JSON workflow for a new project type (e.g. Django app, Discord bot, Flutter app) |
| **Improve existing prompts** | Refine the prompt text in any step to be clearer, more concise, or more effective |
| **Fix a bug** | Find and fix unexpected behavior in the CLI |
| **Improve documentation** | Fix typos, improve explanations, add examples |
| **Suggest a feature** | Open an issue describing a new command or workflow improvement |
| **Test on your platform** | Test the CLI on Windows, macOS, or Linux and report any issues |
| **Translate a template** | Translate template prompts into another language |

---

## Local Development Setup

### 1. Fork and Clone the Repository

```bash
# Fork the repository on GitHub first, then clone your fork
git clone https://github.com/<your-username>/build-with-ai.git
cd build-with-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Link the CLI Globally for Testing

```bash
npm link
```

Now you can run `build-with-ai` from any directory and it will use your local code.

### 4. Run the Test Suite

```bash
npm test
```

All 11 tests should pass before you make any changes.

### 5. Create a Branch for Your Work

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-description
# or
git checkout -b template/mobile-game
```

---

## Project Structure

```
build-with-ai/
├── bin/
│   └── cli.js              # CLI entrypoint — all commands are registered here
├── lib/
│   ├── init.js             # Interactive project setup wizard
│   ├── state.js            # .buildwithai/ file system manager
│   ├── promptEngine.js     # Template loader, placeholder resolver, requires checker
│   ├── contextBuilder.js   # Dot-notation getter/setter for context.json
│   ├── clipboard.js        # Cross-platform clipboard copy helper
│   ├── export.js           # README.md / BUILD_LOG.md / CONTEXT.md generator
│   ├── resume.js           # Welcome-back dashboard
│   ├── ui.js               # Step banners, progress bars, and terminal formatting
│   └── logger.js           # Colorized console logger
├── templates/
│   ├── web-app.json        # 23-step Full-Stack Web App workflow
│   ├── rest-api.json       # 10-step Backend REST API workflow
│   ├── saas-mvp.json       # 15-step Modern SaaS MVP workflow
│   ├── mobile-app.json     # 15-step React Native + Expo workflow
│   ├── chrome-extension.json  # 12-step Chrome Extension workflow
│   └── ai-agent.json       # 14-step AI Agent & RAG Pipeline workflow
├── tests/
│   ├── test-flow.js        # Unit and integration tests (run with `npm test`)
│   └── e2e-test.js         # End-to-end CLI simulation tests
├── README.md
├── CONTRIBUTING.md         # This file
└── package.json
```

---

## Submitting a Pull Request

1. Make your changes on your branch.
2. Run `npm test` and confirm all tests pass.
3. Commit your changes with a clear message:

```bash
# For a new template
git commit -m "template: add flutter-app workflow (12 steps)"

# For a bug fix
git commit -m "fix: handle missing context.json gracefully on status command"

# For a feature
git commit -m "feat: add --no-clipboard flag to suppress clipboard copy"

# For a documentation update
git commit -m "docs: improve step explanation in web-app template step 5"
```

4. Push to your fork:

```bash
git push origin feat/your-feature-name
```

5. Open a Pull Request on GitHub against the `main` branch.
6. Fill in the PR description:
   - What does this change do?
   - Why is it needed?
   - How was it tested?

---

## How to Add a New Template

Adding a new workflow template is the highest-impact contribution you can make. It helps developers building entirely different kinds of projects.

**Popular requests:**
- `flutter-app.json` — Flutter + Dart + Firebase
- `discord-bot.json` — Discord.js + Node.js + Slash Commands
- `django-app.json` — Python + Django + PostgreSQL + Celery
- `cli-tool.json` — Node.js or Go CLI tool with npm/Homebrew publishing
- `browser-game.json` — Canvas + JavaScript + Phaser.js
- `electron-app.json` — Electron + React + auto-updater

### Steps to Add a Template

1. Create a new file in `templates/` named `your-template-type.json`.
2. Follow the [Template Schema Reference](#template-schema-reference) below.
3. Aim for **10-20 steps** covering the full project lifecycle: Discovery → Architecture → Setup → Core Features → Testing → Security → Deployment → Documentation.
4. Run `npx build-with-ai list` to confirm your template appears.
5. Run `npx build-with-ai init`, select your template, and test at least the first 3 steps end-to-end.
6. Open a Pull Request.

---

## Template Schema Reference

Each template is a JSON file with this structure:

```json
{
  "type": "unique-id",
  "title": "Human Readable Title",
  "description": "One-line description of what this template builds.",
  "steps": [
    {
      "id": "step-01-discovery",
      "phase": "Discovery",
      "title": "Short Step Title",
      "goal": "Why this step matters and what outcome it achieves.",
      "requires": ["project.name", "project.idea"],
      "writes": ["decisions.targetAudience", "decisions.coreValueProp"],
      "expectedOutput": "What the AI should produce when given this prompt.",
      "recommendedAI": "Claude 3.5 Sonnet / GPT-4o",
      "targetFiles": ["src/app/page.tsx", "prisma/schema.prisma"],
      "prompt": "The actual prompt text with {{project.name}} placeholders."
    }
  ]
}
```

### Field Reference

| Field | Required | Description |
| :--- | :---: | :--- |
| `type` | Yes | Unique kebab-case ID used to reference the template (e.g. `flutter-app`). Must match the filename without `.json`. |
| `title` | Yes | Human-readable name shown in `list` and `init`. |
| `description` | Yes | One-line summary shown in `list`. |
| `steps[].id` | Yes | Unique kebab-case ID for the step (e.g. `step-03-database`). |
| `steps[].phase` | Yes | Engineering phase label (e.g. `Discovery`, `Architecture`, `Database`, `Frontend`, `Testing`, `Security`, `Deployment`). |
| `steps[].title` | Yes | Short step title shown in banners and status checklist. |
| `steps[].goal` | Yes | Explains *why* this step matters. Shown as `WHY THIS STEP`. |
| `steps[].requires` | Yes | Dot-notation keys that must exist in `context.json` before this step can run (e.g. `decisions.database`). Use `[]` if none. |
| `steps[].writes` | Yes | Dot-notation keys the user is expected to record during `done` (e.g. `decisions.mvpFeatures`). Use `[]` if none. |
| `steps[].expectedOutput` | Yes | What the AI should return. Shown as `WHAT AI SHOULD PRODUCE`. |
| `steps[].recommendedAI` | No | Best AI model for this specific step (e.g. `Claude 3.5 Sonnet / GPT-4o`). Shown in step banner. |
| `steps[].targetFiles` | No | List of files the developer should create or edit during this step (e.g. `["prisma/schema.prisma"]`). Shown in step banner. |
| `steps[].prompt` | Yes | The full prompt text. Use `{{dot.notation}}` for any value from `context.json`. |

### Available Placeholder Values

These are always available in any template prompt:

| Placeholder | Value |
| :--- | :--- |
| `{{project.name}}` | The project name entered during `init` |
| `{{project.idea}}` | The one-line idea entered during `init` |
| `{{project.experienceLevel}}` | Beginner / Intermediate / Experienced |
| `{{project.type}}` | The template ID |
| `{{decisions.anyKey}}` | Any value previously written by an earlier step's `done` |

### Writing Good Prompts

- Be specific. Vague prompts produce vague code.
- Tell the AI to act as a specific expert: *"Act as a Senior Backend Architect"*.
- Number your instructions so the AI produces organized output.
- Reference decisions from prior steps using placeholders like `{{decisions.database}}` — this is the whole point.
- End with a concrete deliverable: *"Provide the complete Prisma schema ready to copy."*

---

## Reporting Bugs

Open a GitHub Issue with:

1. The command you ran.
2. The error message or unexpected output.
3. Your Node.js version (`node --version`).
4. Your operating system.

If relevant, include the contents of `.buildwithai/state.json` (remove any personal project details first).

---

## Suggesting Features

Open a GitHub Issue with the label `enhancement` and describe:

1. The problem you are trying to solve.
2. The proposed solution or command.
3. An example of how it would work from the terminal.

---

## Good First Issues

If you are new to open source and looking for a starting point, these are great areas to help with:

- Fixing typos or improving wording in existing template prompts.
- Adding `targetFiles` or `recommendedAI` to any step that is missing them.
- Writing a new workflow template for a project type not yet covered.
- Improving the wording in error messages in `bin/cli.js`.
- Adding a missing edge case to the test suite in `tests/test-flow.js`.

Look for issues tagged `good first issue` on the GitHub repository.

---

Thank you for contributing. Every template, bug fix, and improvement makes this tool more useful for every developer who uses it.
