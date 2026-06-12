# 📄 AI Research Paper Explainer (Paperlens)

Upload a research-paper PDF and get a clear, structured explanation — **streamed
section by section** as it's generated. Then chat with the paper or have it
explained for a specific audience (Researcher, Product Manager, Executive,
Student).

Built with **Next.js**, **TypeScript**, and the **Vercel AI SDK**, powered by
**Claude (`claude-opus-4-8`)** via the official Anthropic provider.

---

## ✨ Features

- **PDF upload & text extraction** — drag-drop or click to upload; text is
  extracted server-side (no external OCR service).
- **Streaming structured analysis** — the analysis fills in progressively
  (_Generating Summary… → Contributions… → Methodology…_) rather than waiting
  for the whole response:
  - Executive Summary
  - Key Contributions
  - Methodology
  - Limitations
  - Future Work
  - Key Citations
- **Chat with the paper** — ask follow-up questions, answered strictly from the
  paper's content.
- **Explain like a persona** — one click reframes the paper for a **Researcher**,
  **Product Manager**, **Executive**, or **Student**.
- **Modern UI** — responsive SaaS-style dashboard, light/dark mode, loading
  states, and friendly error toasts.

---

## 🧱 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| AI orchestration | [Vercel AI SDK](https://sdk.vercel.ai) (`ai` v6) |
| Model provider | `@ai-sdk/anthropic` → **Claude `claude-opus-4-8`** |
| PDF extraction | [`unpdf`](https://github.com/unjs/unpdf) (serverless pdf.js) |
| Schema / validation | `zod` |
| UI | Tailwind CSS v4, shadcn-style components, `lucide-react`, `sonner`, `next-themes` |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js 20+** (required by Next.js 16)
- An **Anthropic API key** — create one at
  [console.anthropic.com](https://console.anthropic.com/settings/keys)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your API key

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

> `.env.local` is git-ignored, so your key is never committed.

### 4. Run the dev server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

### 5. Use it

1. Upload a **text-based** research-paper PDF (under 20 MB).
2. Watch the analysis stream in.
3. Use the right-panel tabs: **Chat**, **Explain**, **Citations**.

---

## 📡 API Endpoints

All routes run on the Node.js runtime and require `ANTHROPIC_API_KEY`.

### `POST /api/analyze`

Accepts a `multipart/form-data` upload and **streams** the structured analysis.

- **Body:** form field `file` (a PDF)
- **Flow:** validate → extract text (`unpdf`) → `streamObject` (Claude) → stream
- **Returns:** a `text/plain` stream of the analysis JSON as it is generated
- **Pre-stream errors (JSON):** `400` (no/empty file), `413` (>20 MB),
  `415` (not a PDF), `422` (no extractable text — e.g. scanned/image-only),
  `500` (missing key)

### `POST /api/chat`

Streaming chat grounded in the paper.

- **Body:** `{ messages: UIMessage[], paperContext: string }`
- **Returns:** a UI-message stream (consumed by `@ai-sdk/react`'s `useChat`)

### `POST /api/explain`

Streams an audience-tailored explanation.

- **Body:** `{ paperContext: string, persona: 'researcher' | 'product-manager' | 'executive' | 'student' }`
- **Returns:** a `text/plain` stream

---

## 🗂️ Project Structure

```
app/
  api/
    analyze/route.ts    # PDF upload + extraction + streamed structured analysis
    chat/route.ts       # chat with the paper
    explain/route.ts    # persona explanations (streaming)
  page.tsx              # main UI: upload → streamed analysis → tabs
  layout.tsx, globals.css
components/
  upload-area.tsx       # label-based dropzone (click + drag-drop)
  analysis-view.tsx     # progressive section cards ("Generating …")
  chat-interface.tsx    # chat panel
  persona-explainer.tsx # persona buttons + streamed output
  citation-panel.tsx    # citations list
  ui/                   # shadcn-style primitives
lib/
  pdf.ts                # PDF text extraction (unpdf) + validation limits
  types.ts              # PaperAnalysis / PartialAnalysis types
```

---

## 🏗️ How It Works

1. The browser uploads the PDF to `/api/analyze` as `multipart/form-data`.
2. The server validates the file and extracts its text with `unpdf`
   (`lib/pdf.ts`), rejecting scanned/image-only PDFs with a clear message.
3. The text is sent to Claude via the Vercel AI SDK's `streamObject`, constrained
   to a `zod` schema, and the partial JSON is streamed back.
4. The client parses the partial stream with `parsePartialJson` and renders each
   section the moment it arrives.
5. Once complete, the structured result becomes the **context** for the Chat and
   Explain features.

---

## 🛠️ Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm start        # run the production build
npm run lint     # lint
```

---

## 🧯 Troubleshooting

| Symptom | Cause / Fix |
| --- | --- |
| Toast: _"server is not configured… Set ANTHROPIC_API_KEY"_ | Key missing — set it in `.env.local` and **restart** `npm run dev`. |
| Toast: _"Could not extract enough text… scanned or image-only"_ | The PDF has no text layer (it's images). Use a text-based PDF; image PDFs need OCR. |
| Toast: _"rate limited"_ / _"did not complete"_ | Anthropic rate limit or a transient model error — retry. Check server logs (prefixed `[analyze]` / `[chat]` / `[explain]`). |
| `401 invalid x-api-key` in terminal | Bad or placeholder key in `.env.local`. |
| Upload does nothing | Hard-refresh (**Cmd/Ctrl+Shift+R**). If still stuck, stop the server, delete `.next/`, and re-run `npm run dev`. |

---

## ☁️ Deployment

1. Push to GitHub.
2. Import the repo into **Vercel** (or another host).
3. Set the **`ANTHROPIC_API_KEY`** environment variable in the host's project
   settings.
4. Deploy — the `/api/*` routes run as server functions.

---

## 📝 Notes

- The app calls the Claude API **directly** through `@ai-sdk/anthropic` (driven by
  `ANTHROPIC_API_KEY`), not through a gateway.
- Analysis uses **text extraction** (cheaper, robust). For figure/table/equation-
  heavy papers, Claude's native PDF support could be used instead — a possible
  future enhancement.
- Default model is `claude-opus-4-8`; change it in the `MODEL` constant inside the
  `app/api/*/route.ts` files.
