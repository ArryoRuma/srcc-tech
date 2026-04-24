# SRCC Tech Changelog

A running log of technology updates, A/V changes, and infrastructure improvements at Stone Ridge Community Church — built with [Nuxt UI](https://ui.nuxt.com).

## How to add a new update

All tech updates live as individual Markdown files in the `content/updates/` folder. To add one:

1. Create a new file following the naming pattern `YYYY-MM-DD-short-description.md`  
   Example: `2026-05-01-new-wireless-mics.md`

2. Start the file with frontmatter, then write your update body:

```md
---
title: New Wireless Microphones
date: 2026-05-01
tag: v1.3.0
category: Audio
published: true
---

## What Changed

Installed four new Shure SLX-D wireless handheld microphones in the sanctuary.

## Why

...

## Impact

...
```

**Required fields**

| Field | Description |
|---|---|
| `title` | Short display name shown in the changelog |
| `date` | ISO date in `YYYY-MM-DD` format — controls sort order |
| `published` | Set to `true` to make it live; `false` to draft it |

**Optional fields**

| Field | Description |
|---|---|
| `tag` | Version label shown next to the title (e.g., `v1.3.0`) |
| `category` | Badge shown on the update card (e.g., `Audio`, `Livestream`, `Website`, `Displays`) |

3. Save the file and commit it to the repo. The site rebuilds automatically on Vercel (or run `pnpm dev` locally to preview first).

---

## Resource drop zone

Use `resources/` to paste SOPs, reference files, diagrams, and other operational docs.

- `resources/sops/`
- `resources/runbooks/`
- `resources/references/`
- `resources/vendor-docs/`
- `resources/diagrams/`
- `resources/templates/`
- `resources/handoff/`
- `resources/archive/`

See `resources/README.md` for naming and organization guidance.

---

## Setup

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Renovate integration

Install [Renovate GitHub app](https://github.com/apps/renovate/installations/select_target) on your repository and you are good to go.
