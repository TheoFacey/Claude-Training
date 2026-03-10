# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup
npm run setup          # install deps + generate Prisma client + run migrations

# Development
npm run dev            # start dev server with Turbopack at localhost:3000
npm run dev:daemon     # same, but background (logs to logs.txt)

# Build & production
npm run build
npm start

# Testing
npm test               # run all tests with vitest
npm test -- --run src/lib/transform/__tests__/jsx-transformer.test.ts  # single test file

# Linting
npm run lint

# Database
npm run db:reset       # reset and re-run all migrations (destructive)
npx prisma migrate dev # apply new migrations
npx prisma studio      # GUI for the database
```

Set `ANTHROPIC_API_KEY` in `.env` to use real AI. Without it, a `MockLanguageModel` in `src/lib/provider.ts` returns static component demos.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat, Claude generates them via tool calls, and a live preview renders the result in an iframe — all without writing files to disk.

### Data flow

1. User submits a message in `ChatInterface`
2. `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls `POST /api/chat` via Vercel AI SDK's `useChat`, passing the serialized virtual file system and an optional `projectId`
3. The API route (`src/app/api/chat/route.ts`) streams a response from Claude (or the mock provider), using two tools: `str_replace_editor` and `file_manager`
4. Tool calls stream back to the client; `onToolCall` in `ChatContext` dispatches them to `FileSystemContext.handleToolCall`
5. `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) mutates the in-memory `VirtualFileSystem` and increments `refreshTrigger`
6. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) reacts to `refreshTrigger`, compiles all virtual files with Babel (`src/lib/transform/jsx-transformer.ts`), builds an import map (with blob URLs for local files and `esm.sh` CDN for third-party packages), and writes the result to an iframe via `srcdoc`

### Key abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory tree of `FileNode` objects. All AI-generated code lives here — nothing is written to the real filesystem. Supports CRUD, rename, serialize/deserialize for DB persistence.
- **`jsx-transformer.ts`**: Client-side Babel transform (TypeScript + JSX). `createImportMap` builds the browser import map; `createPreviewHTML` generates the full iframe HTML with an error boundary and syntax error overlay.
- **`src/lib/provider.ts`**: Returns either the real Anthropic model (`claude-haiku-4-5`) or `MockLanguageModel` based on whether `ANTHROPIC_API_KEY` is set.
- **`src/lib/tools/`**: Server-side AI tool definitions (`str_replace_editor`, `file_manager`) that operate on a `VirtualFileSystem` instance reconstructed from the request body.
- **`src/lib/prompts/generation.tsx`**: System prompt for Claude, cached via Anthropic's `cacheControl: ephemeral`.

### Auth & persistence

- JWT-based auth via `jose` stored in an httpOnly cookie (`src/lib/auth.ts`)
- Prisma + SQLite (`prisma/dev.db`). Schema: `User` and `Project`. A `Project` stores `messages` (JSON array) and `data` (serialized `VirtualFileSystem`) as strings.
- Anonymous users can work freely; their state is tracked in `src/lib/anon-work-tracker.ts` (localStorage). On sign-up, the prompt to save anonymous work appears.
- Projects are only persisted on the server when a user is authenticated. The `projectId` is passed through the chat body and the API route saves after each generation.

### UI layout

The main page (`src/app/page.tsx`) and project page (`src/app/[projectId]/page.tsx`) both render `MainContent` which provides `FileSystemProvider` and `ChatProvider`, then renders a resizable panel layout: **Chat** (left) | **Preview / Code editor** (right, with tabs).

### Prisma client location

Generated to `src/generated/prisma` (not the default). Import from `@/lib/prisma` (singleton) rather than directly from the generated path.

### Database schema

The schema is defined in `prisma/schema.prisma`. Reference it whenever you need to understand the structure of data stored in the database.
