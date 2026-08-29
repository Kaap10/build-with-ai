# build-with-ai

> A zero-API, open-source CLI that guides you step-by-step through building complete software projects with any AI — by generating the right prompt at every stage.

[![npm version](https://img.shields.io/npm/v/build-with-ai.svg)](https://www.npmjs.com/package/build-with-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero API Keys](https://img.shields.io/badge/AI_API-None_(100%25_Local)-green.svg)](README.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Kaap10/build-with-ai/pulls)

---

## What Is build-with-ai?

`build-with-ai` is a local CLI tool that acts as your **AI project copilot**. It breaks software development into structured, step-by-step engineering phases and generates a context-aware, copy-ready prompt for each stage. You paste that prompt into any AI tool you already use, implement the output, and record your decisions. The CLI remembers every architectural choice you make and automatically injects those decisions into future prompts — so you never lose context mid-project.

**It does not call any AI API.** It does not require any account, subscription, or internet connection. It is 100% local.

---

## The Problem It Solves

When beginners and developers try to build a real application with AI, they hit three invisible walls:

**1. The Blank Canvas Problem**
You open ChatGPT and type: *"Build me a full-stack expense tracker."* The AI returns 800 lines of code you don't understand, half of it wrong, none of it connected. You don't know what to ask next.

**2. Context Drift**
In Step 1 you chose PostgreSQL with Prisma. By Step 8, in a new chat window, the AI suggests MongoDB. Your architecture falls apart because the AI forgot what you decided earlier.

**3. Skipping Critical Engineering Phases**
Most developers jump straight to writing components before defining their database schema, API contracts, or auth strategy — creating technical debt that is painful to undo later.

`build-with-ai` solves all three by acting as the **memory layer and guide** between you and your AI. It tells you what to ask, in what order, and carries every decision forward automatically.

---

## Features

- **Step-by-step structured workflow** — Breaks projects into clear engineering phases (Discovery, Architecture, Database, Auth, Frontend, Testing, Security, Deployment, Portfolio).
- **Automatic context injection** — Decisions recorded in Step 1 are automatically embedded into Step 8 prompts via `{{decisions.database}}` placeholders. No repetition.
- **Copy-to-clipboard** — Every generated prompt is auto-copied to your clipboard. Just switch to your AI and paste.
- **Works with any AI** — ChatGPT, Claude, Gemini, DeepSeek, Cursor, Copilot, or a local Ollama model. No API key needed.
- **RECOMMENDED AI hints** — Each step suggests the best AI model for that specific task.
- **TARGET FILES hints** — Each step shows exactly which files you should be creating or editing.
- **Jump to any step** — Freely navigate forward or backward using `jump`, `back`, and `next`.
- **Direct context editing** — Fix or update any recorded decision instantly with `set` and `context` commands.
- **Custom template loading** — Use your own local JSON template or load one from a remote URL.
- **Export to Markdown** — Generate `README.md`, `BUILD_LOG.md`, and `CONTEXT.md` from your recorded decisions when done.
- **6 built-in templates** — Full-Stack Web App, REST API, SaaS MVP, Mobile App (Expo), Chrome Extension, AI Agent & RAG Pipeline.
- **Zero API keys, zero cloud, zero telemetry** — Completely private and local.

---

## Installation

Run directly with `npx` — no installation needed:

```bash
npx build-with-ai
```

Or install globally:

```bash
npm install -g build-with-ai
```

---

## User Story: Riya Builds a SaaS App From Scratch

Here is what a complete session with `build-with-ai` looks like for a real developer.

---

### The Situation

Riya is an intermediate developer. She has a SaaS idea: **a subscription tool for freelancers to track client invoices**. She has used ChatGPT before but always gets overwhelmed halfway through — she ends up with disconnected code snippets and no idea how to put them together. She wants structure.

She opens her terminal and starts.

---

### Step 1: First Launch

```bash
mkdir invoice-tracker && cd invoice-tracker
npx build-with-ai
```

The CLI sees no `.buildwithai/` folder exists and asks:

```
No active project found in this directory.
Would you like to initialize a new project with build-with-ai now? (Y/n)
```

Riya presses **Enter**.

---

### Step 2: Initialization (`init`)

The CLI walks Riya through 4 quick questions:

```
Select project type / template:
  Full-Stack Web Application (23 steps)
  Modern SaaS MVP (15 steps)           <-- Riya selects this
  Backend REST API Service (10 steps)
  Cross-Platform Mobile App (15 steps)
  Chrome Browser Extension (12 steps)
  AI Agent & RAG Pipeline (14 steps)

What is your coding experience level?
  Intermediate                          <-- selected

Project name:
  Invoice Tracker

One-line project idea / problem description:
  A subscription SaaS for freelancers to track client invoices and get paid faster.
```

The CLI creates:

```
invoice-tracker/
└── .buildwithai/
    ├── state.json      (progress tracking)
    ├── context.json    (decisions memory)
    └── history/        (AI response archive)
```

Output:
```
Initialized "Invoice Tracker" successfully!
Next step: Run npx build-with-ai next to generate your first prompt.
```

---

### Step 3: Generating Step 1's Prompt (`next`)

```bash
npx build-with-ai next
```

The CLI displays:

```
STEP 1/15 — Problem Discovery & SaaS Value Proposition
PHASE: Discovery
RECOMMENDED AI: Claude 3.5 Sonnet / GPT-4o
TARGET FILES: (none yet)

WHY THIS STEP: Identify the target customer segment, define the core pain point,
and craft a compelling SaaS value proposition.

WHAT AI SHOULD PRODUCE: Clear customer persona, 2-sentence value proposition, and
3 measurable success metrics.

──────────────────────────────────────────────────────────
PROMPT FOR YOUR AI:
──────────────────────────────────────────────────────────
I am building a SaaS product called "Invoice Tracker".
The core idea is: A subscription SaaS for freelancers to track client invoices
and get paid faster.
My experience level is Intermediate.

Act as a SaaS product strategist:
1. Define the primary customer persona (role, company size, key pain point).
2. Write a crisp 2-sentence value proposition...
──────────────────────────────────────────────────────────

Prompt copied to clipboard
When done with your AI conversation, run: npx build-with-ai done
```

Riya switches to Claude, pastes the prompt, and gets back a clear persona and value proposition in 30 seconds.

---

### Step 4: Recording Decisions (`done`)

```bash
npx build-with-ai done
```

```
Completing Step 1/15: Problem Discovery & SaaS Value Proposition

How would you like to record the result of this step?
  Enter short summary / decisions (Recommended for context injection)  <-- selected
  Paste full AI response
  Both
  Skip

Recording key decisions for future step prompts:
  Decision for "Target Customer" (decisions.targetCustomer):
  > Freelance designers and consultants, 1-3 person businesses

  Decision for "Core Value Prop" (decisions.coreValueProp):
  > Invoice Tracker helps freelancers send professional invoices in minutes and
    get paid 40% faster by automating payment reminders and tracking overdue clients.

Saved decisions to context.json

Step 1 completed! Advanced to Step 2/15.
Next: Run npx build-with-ai next to generate the next prompt.
```

---

### Step 5: Context Auto-Injection in Step 3 (`next`)

By the time Riya reaches **Step 3: Tech Stack Selection**, she runs:

```bash
npx build-with-ai next
```

The CLI automatically injects her previous decisions into the prompt:

```
STEP 3/15 — SaaS Technology Stack Selection
PHASE: Tech Stack
RECOMMENDED AI: Claude 3.5 Sonnet / GPT-4o
TARGET FILES: package.json

PROMPT FOR YOUR AI:
──────────────────────────────────────────────────────────
My experience level is Intermediate and "Invoice Tracker" needs these features:
As a freelancer, I want to create and send invoices so that clients can pay online.
As a freelancer, I want automated reminders so that I stop chasing late payments.
...

The target customer is: Freelance designers and consultants, 1-3 person businesses.
The core value proposition is: Invoice Tracker helps freelancers send professional
invoices in minutes and get paid 40% faster by automating payment reminders...

Recommend the optimal SaaS tech stack...
──────────────────────────────────────────────────────────
```

Riya never had to re-explain her customer or features. The CLI injected them automatically.

---

### Step 6: Correcting a Decision (`set`)

After reviewing Claude's recommendation, Riya initially recorded `decisions.database = "SQLite"` but now wants to change it to PostgreSQL. She runs:

```bash
npx build-with-ai set decisions.database "PostgreSQL with Prisma ORM"
```

```
Updated "decisions.database"
  Before: SQLite
  After:  PostgreSQL with Prisma ORM
```

No JSON editing required.

---

### Step 7: Skipping Ahead (`jump`)

Riya feels confident about auth and wants to jump directly to Step 7 (Stripe Payments):

```bash
npx build-with-ai jump 7
```

```
Jumped to Step 7/15.
Run npx build-with-ai next to generate this step's prompt.
```

---

### Step 8: Checking Progress (`status`)

```bash
npx build-with-ai status
```

```
PROJECT STATUS: Invoice Tracker
───────────────────────────────────────────────────────
Template:   Modern SaaS MVP
Experience: Intermediate
Idea:       A subscription SaaS for freelancers...
Progress:   [████████░░░░░░░░░░░░░░░░░] 40% (6/15 steps)

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

RECORDED DECISIONS:
  • targetCustomer: Freelance designers and consultants
  • coreValueProp: Invoice Tracker helps freelancers...
  • frontendStack: Next.js 14 App Router + Tailwind CSS + Shadcn UI
  • database: PostgreSQL with Prisma ORM
  • authProvider: Supabase Auth with Google OAuth
```

---

### Step 9: Exporting Documentation (`export`)

After completing all 15 steps, Riya runs:

```bash
npx build-with-ai export
```

Three files are generated:

```
Documentation exported successfully!

  README.md          (Project summary & setup guide)
  BUILD_LOG.md       (Full step-by-step history log)
  .buildwithai/CONTEXT.md  (Decisions markdown view)
```

`README.md` is now a professional, pre-filled document with her tech stack, features, and setup instructions.
`BUILD_LOG.md` is a complete record of every decision and AI response — portfolio-ready.

---

## Commands Reference

| Command | What It Does |
| :--- | :--- |
| `npx build-with-ai` | Smart launcher — shows project status or offers to initialize. |
| `npx build-with-ai init` | Start interactive setup wizard (template, experience, project idea). |
| `npx build-with-ai init --template <path\|url>` | Load a custom or community template JSON file. |
| `npx build-with-ai next` | Generate and clipboard-copy the current step's AI prompt. |
| `npx build-with-ai next --raw` | Print only the raw prompt string (useful for piping to scripts). |
| `npx build-with-ai done` | Record step decisions into context.json and advance to next step. |
| `npx build-with-ai back` | Move back to the previous step without deleting history. |
| `npx build-with-ai jump <step>` | Jump directly to any step number. |
| `npx build-with-ai context [key]` | View all recorded decisions, or a specific key. |
| `npx build-with-ai set <key> <value>` | Update any recorded decision on the fly. |
| `npx build-with-ai status` | Visual progress bar, step checklist, and recorded decisions. |
| `npx build-with-ai resume` | Welcome-back dashboard with current focus and progress. |
| `npx build-with-ai export` | Generate README.md, BUILD_LOG.md, and CONTEXT.md. |
| `npx build-with-ai list` | List all available templates and their step counts. |
| `npx build-with-ai reset` | Reset workflow state (never touches your source code). |

---

## Available Templates

| Template | Steps | Stack |
| :--- | :---: | :--- |
| Full-Stack Web Application | 23 | Next.js, Tailwind, Prisma, PostgreSQL |
| Modern SaaS MVP | 15 | Next.js, Supabase, Stripe, Resend |
| Backend REST API Service | 10 | Node.js, Express/Fastify, PostgreSQL |
| Cross-Platform Mobile App | 15 | React Native, Expo Router, EAS Build |
| Chrome Browser Extension | 12 | Manifest V3, Vite, React |
| AI Agent & RAG Pipeline | 14 | LangChain, Vector DB, FastAPI |

---

## Open Source

build-with-ai is free and open source under the MIT License.

Contributions, new project templates, bug reports, and improvements are welcome.

### Local Development

```bash
git clone https://github.com/Kaap10/build-with-ai.git
cd build-with-ai
npm install
npm test
npm link
```

GitHub: https://github.com/Kaap10/build-with-ai

---

## License

MIT (c) [build-with-ai contributors](LICENSE)
