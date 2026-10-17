# MEMORY — kllasikWardrobe-1

> Current state only. Rewritten when reality changes; never a diary, never contradictory facts side by side. Read top to bottom at every session start. No secrets.

## Current Position

- Owner: **Master** (address as Master across all sessions)
- State: Production database and catalog synchronization operational. Upstash Redis (`klasik:products_v2` hash) and Vercel Blob storage connected.
- Active Focus: Production verification complete. Cross-device catalog synchronization verified.

## Fixed Decisions

- Brand: Klasik Wardrobe (never change).
- Primary Accent: Purple `#7C3AED` / `#6D28D9` / `#EDE9FE`.
- Background: `#F7F7F8` soft off-white, cards `#FFFFFF` rounded-3xl (`24px`), images `#EDEDEF` rounded-2xl (`20px`).
- Catalog Database: Upstash Redis hash `klasik:products_v2` with read-back verification; no local `/tmp` or browser `localStorage` fallback storage.

## Architecture

- Framework: Next.js 16 with Turbopack, Tailwind CSS, Framer Motion, Zustand cart store, Lucide icons.
- Database: Upstash Redis (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) with atomic stock management and verified write read-back.
- Media Storage: Vercel Blob (`BLOB_READ_WRITE_TOKEN`).

## Features

- Mobile sticky navbar with expandable search and bag count pill.
- Floating mobile bottom navigation bar (`BottomNav`).
- Hero carousel with auto-sliding, drag/touch swipe, and dot navigation.
- 4-card category selector row and responsive product grid (2-column on mobile).
- Shop The Look interactive colorway showcase with transparent cutouts.
- Quick view modal and product detail page with 12px size chips and sticky floating mobile checkout bar.
- Cart drawer with ₦70,000 free shipping progress meter and Paystack integration.

## Environment

- Node.js, Next.js 16 (Turbopack), Tailwind CSS.
- Production hosting: Vercel (`kllasik-wardrobe.vercel.app`).

## Gotchas

- Hero t-shirt assets must maintain 100% alpha transparency outside garment bounds without baked checkerboard pixels.
- Zero emojis anywhere in code, markdown, comments, or output (Core Principle 3).
