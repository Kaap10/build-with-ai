# build-with-ai

> A zero-API, local-first CLI that guides you step-by-step through building complete software projects with any AI — by generating the right prompt at every stage.

<div align="center">

[![CI](https://github.com/Kaap10/build-with-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Kaap10/build-with-ai/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/build-with-ai.svg?style=flat&color=3b82f6)](https://www.npmjs.com/package/build-with-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)
[![Node >= 16](https://img.shields.io/badge/node-%3E%3D16.0.0-f59e0b.svg)](https://nodejs.org)
[![Zero API Keys](https://img.shields.io/badge/AI_API-None_(100%25_Local)-8b5cf6.svg)](README.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Quickstart](#quickstart) • [How It Works](#how-it-works) • [Architecture](#architecture) • [User Story Walkthrough](#user-story-riya-builds-a-saas-app) • [Commands](#commands-reference) • [Templates](#available-templates) • [Contributing](CONTRIBUTING.md)

</div>

---

## What Is build-with-ai?

`build-with-ai` is an interactive CLI orchestrator that acts as your **personal software architect**. It breaks software development down into disciplined, sequential engineering phases and generates context-aware, copy-ready prompts for each stage.

You paste the prompt into any AI assistant you already use (Claude, ChatGPT, Cursor, Gemini, DeepSeek, Copilot, or local Ollama models), build that step, and record your decisions. The CLI remembers every architectural choice you make in a local `.buildwithai/` store and automatically injects those decisions into future step prompts.

**Key Guarantee: Zero API keys, zero accounts, zero telemetry, and zero cost.** It never touches or overwrites your application source code.

---

## The Problem It Solves

When developers try to build non-trivial applications with AI assistants, they consistently hit three major roadblocks:

| The Problem | What Happens | How `build-with-ai` Solves It |
| :--- | :--- | :--- |
| **The Blank Canvas** | You ask for a "full app" and get 800 lines of fragmented, unmaintainable code. | Breaks projects into 10-23 sequential phases: Discovery $\rightarrow$ Schema $\rightarrow$ Auth $\rightarrow$ Core CRUD $\rightarrow$ Testing $\rightarrow$ Deploy. |
| **Context Drift** | By step 8, in a new chat, the AI forgets earlier decisions (e.g. database, auth models). | Maintains a local `context.json` memory and automatically injects decisions into downstream prompts (`{{decisions.database}}`). |
| **Skipping Phases** | Developers jump straight to frontend UI before designing schemas, auth, or error contracts. | Step prerequisites (`requires`) ensure architecture is defined before coding begins. |

---

## How It Works

```mermaid
graph LR
    subgraph Local Machine
        CLI[build-with-ai CLI]
        Store[(.buildwithai/ Memory)]
        Code[Your App Code]
    end

    subgraph Any AI Assistant
        AI[Claude / ChatGPT / Cursor / DeepSeek]
    end

    CLI -->|1. Generate Prompt & Auto-Copy| Clipboard[System Clipboard]
    Clipboard -->|2. Paste Prompt| AI
    AI -->|3. Produces Architecture & Code| Developer[Developer]
    Developer -->|4. Writes Code| Code
    Developer -->|5. Records Key Decisions| CLI
    CLI -->|6. Saves to context.json| Store
    Store -->|7. Injects Context into Next Steps| CLI
```

---

## Quickstart

Run directly without installing via `npx`:

```bash
npx build-with-ai
```

Or install globally:

```bash
npm install -g build-with-ai
```

---

## Features

- **Step-by-Step Structured Workflows** — Guides you through Discovery, Architecture, Schema, Scaffolding, Auth, Core CRUD, UI, Testing, Security, Deployment, and Portfolio Documentation.
- **Automatic Context Injection** — Architectural choices made in early steps are automatically embedded into downstream prompts using `{{decisions.key}}` interpolation.
- **Auto-Clipboard Integration** — Every prompt is automatically copied to your clipboard with cross-platform fallback safety.
- **Universal AI Compatibility** — Works with ChatGPT, Claude, Gemini, DeepSeek, Cursor, GitHub Copilot, or local Ollama models.
- **RECOMMENDED AI & TARGET FILES Hints** — Every step banner displays recommended AI models and specific target files to create or edit.
- **Direct Context Modification** — View or update decisions on the fly with `build-with-ai context` and `build-with-ai set <key> <value>`.
- **Arbitrary Step Navigation** — Jump to any step using `build-with-ai jump <stepNumber>` or step back with `build-with-ai back`.
- **Custom Template Loading** — Load community templates from local JSON files or remote HTTPS URLs (`--template <path-or-url>`).
- **Deterministic Documentation Export** — Generates complete `README.md`, `BUILD_LOG.md`, and `CONTEXT.md` documentation when finished.
- **6 Built-in Production Templates** — Full-Stack Web App, REST API, SaaS MVP, Mobile App (Expo), Chrome Extension, and AI Agent & RAG Pipeline.
- **100% Local & Private** — No telemetry, no network calls to proprietary AI APIs, and zero vendor lock-in.

---

## User Story: Riya Builds a SaaS App

Here is what a complete development session looks like for a real developer.

### 1. Project Initialization

```bash
mkdir invoice-tracker && cd invoice-tracker
npx build-with-ai init
```

Riya selects the **Modern SaaS MVP** template (15 steps), sets her experience level to **Intermediate**, and enters her project idea:

```text
Project: Invoice Tracker
Idea:    A subscription SaaS for freelancers to track client invoices and automate payment reminders.
```

The CLI scaffolds `.buildwithai/` (`state.json`, `context.json`, `history/`).

### 2. Generating the First Prompt (`next`)

```bash
npx build-with-ai next
```

The CLI outputs the formatted step and copies the prompt to the clipboard:

```text
 STEP 1/15 — Problem Discovery & SaaS Value Proposition 

PHASE: Discovery
RECOMMENDED AI: Claude 3.5 Sonnet / GPT-4o

WHY THIS STEP: Identify the target customer segment, define the core pain point,
and craft a compelling SaaS value proposition.
WHAT AI SHOULD PRODUCE: Clear customer persona, 2-sentence value proposition, and
3 measurable success metrics.

────────────────────────────────────────────────────────────
PROMPT FOR YOUR AI:
────────────────────────────────────────────────────────────
I am building a SaaS product called "Invoice Tracker".
The core idea is: A subscription SaaS for freelancers to track client invoices...
My experience level is Intermediate.

Act as a SaaS product strategist:
1. Define the primary customer persona (role, company size, key pain point).
2. Write a crisp 2-sentence value proposition...
────────────────────────────────────────────────────────────

Prompt copied to clipboard ✅
```

### 3. Recording Decisions (`done`)

After pasting the prompt into Claude and receiving the response, Riya runs:

```bash
npx build-with-ai done
```

She enters concise summaries for `decisions.targetCustomer` and `decisions.coreValueProp`. The decisions are saved to `context.json`, and the CLI advances to Step 2.

### 4. Automatic Context Injection (Step 3)

When Riya reaches **Step 3: Technology Stack Selection**, the CLI automatically retrieves her previously recorded decisions:

```text
 STEP 3/15 — SaaS Technology Stack Selection 

PHASE: Tech Stack
RECOMMENDED AI: Claude 3.5 Sonnet / GPT-4o
TARGET FILES: package.json

PROMPT FOR YOUR AI:
────────────────────────────────────────────────────────────
My experience level is Intermediate and "Invoice Tracker" needs these features:
[Injected from Step 2: MVP Features]

The target customer is: Freelance designers and consultants.
The core value proposition is: Invoice Tracker helps freelancers send professional
invoices in minutes and get paid 40% faster...

Recommend the optimal SaaS tech stack...
────────────────────────────────────────────────────────────
```

### 5. On-the-Fly Decision Editing (`set`)

If Riya decides to change her database from SQLite to PostgreSQL with Prisma:

```bash
npx build-with-ai set decisions.database "PostgreSQL with Prisma ORM"
```

```text
✔ Updated "decisions.database"
  Before: SQLite
  After:  PostgreSQL with Prisma ORM
```

### 6. Checking Progress (`status`)

```bash
npx build-with-ai status
```

```text
PROJECT STATUS: Invoice Tracker
───────────────────────────────────────────────────────
Template:   Modern SaaS MVP
Experience: Intermediate
Progress:   [████████████░░░░░░░░░░░░] 47% (7/15 steps)

WORKFLOW STEPS:
  ✔ 1. Problem Discovery [Discovery]
  ✔ 2. MVP Feature Scoping [Requirements]
  ✔ 3. SaaS Technology Stack [Tech Stack]
  ✔ 4. Supabase Database Schema [Database]
  ✔ 5. Next.js API Routes [API]
  ✔ 6. Supabase Auth Flow [Authentication]
  ➤ 7. Stripe Subscription Integration [Payments] (Current)
  ○ 8. Transactional Emails with Resend [Email]
  ...
```

### 7. Exporting Production Documentation (`export`)

Upon completing the workflow, Riya runs:

```bash
npx build-with-ai export
```

Three deterministic documentation files are generated:
- `README.md` — Complete project overview, architecture breakdown, and setup instructions.
- `BUILD_LOG.md` — Chronological changelog tracking every design decision and saved response.
- `.buildwithai/CONTEXT.md` — Markdown projection of all recorded architectural decisions.

---

## Commands Reference

| Command | Description |
| :--- | :--- |
| `npx build-with-ai` | Smart launcher — displays project status or initiates onboarding. |
| `npx build-with-ai init` | Start interactive setup wizard (template, experience, project idea). |
| `npx build-with-ai init --template <path\|url>` | Load a custom template from a local file path or remote HTTPS URL. |
| `npx build-with-ai next` | Generate and clipboard-copy the prompt for the active step. |
| `npx build-with-ai next --raw` | Print only the raw prompt string (ideal for scripting and CLI pipes). |
| `npx build-with-ai next --json` | Print complete step metadata as structured JSON. |
| `npx build-with-ai done` | Record decisions into `context.json`, archive response, and advance step. |
| `npx build-with-ai back` | Move back to the previous step without deleting recorded history. |
| `npx build-with-ai jump [stepNumber]` | Jump directly to any step number (interactive step picker fallback). |
| `npx build-with-ai context [key]` | Inspect all recorded decisions or look up a specific dot-notation key. |
| `npx build-with-ai set <key> <value>` | Update any decision in `context.json` directly from the terminal. |
| `npx build-with-ai status` | Display visual progress bar, step status checklist, and recorded decisions. |
| `npx build-with-ai resume` | Welcome-back dashboard summarizing current focus and next action. |
| `npx build-with-ai export` | Generate `README.md`, `BUILD_LOG.md`, and `.buildwithai/CONTEXT.md`. |
| `npx build-with-ai list` | List all available built-in templates and their total step counts. |
| `npx build-with-ai reset` | Safely remove `.buildwithai/` state (never touches user code). |

---

## Available Templates

| Template ID | Template Title | Steps | Primary Tech Stack |
| :--- | :--- | :---: | :--- |
| `web-app` | **Full-Stack Web Application** | 23 | Next.js / React, Tailwind CSS, Prisma ORM, PostgreSQL |
| `saas-mvp` | **Modern SaaS MVP** | 15 | Next.js 14 App Router, Supabase, Stripe, Resend Email |
| `rest-api` | **Backend REST API Service** | 10 | Node.js, Fastify / Express, PostgreSQL, Zod |
| `mobile-app` | **Cross-Platform Mobile App** | 15 | React Native, Expo Router, NativeWind, EAS Build |
| `chrome-extension` | **Chrome Browser Extension** | 12 | Manifest V3, Vite, React, Shadow DOM |
| `ai-agent` | **AI Agent & RAG Pipeline** | 14 | LangChain / LlamaIndex, Vector DB, FastAPI / Express |

---

## Architecture & Storage Design

All metadata and state are stored in a self-contained `.buildwithai/` folder in your project root:

```text
my-project/
├── .buildwithai/
│   ├── state.json        # Progress tracking (currentStep, completedSteps, timestamps)
│   ├── context.json      # Structured decisions store (single source of truth)
│   ├── CONTEXT.md        # Generated markdown view of context.json
│   └── history/          # Archived raw AI responses (step-01.md, step-02.md, ...)
├── src/                  # User application code (never touched by CLI)
├── README.md             # Generated on export
└── BUILD_LOG.md          # Generated on export
```

---

## Open Source & Community

`build-with-ai` is free and open-source software under the [MIT License](LICENSE).

- **Contributing Guide:** See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, template authoring schema, and PR guidelines.
- **Code of Conduct:** See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- **Security Policy:** See [SECURITY.md](SECURITY.md).
- **Changelog:** See [CHANGELOG.md](CHANGELOG.md).

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/Kaap10/build-with-ai.git
cd build-with-ai

# 2. Install dependencies
npm install

# 3. Run test suites
npm test
npm run test:e2e

# 4. Link CLI globally for local testing
npm link
build-with-ai
```

---

## License

MIT © [build-with-ai contributors](LICENSE)
