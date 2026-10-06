# MEMORY — kllasikWardrobe-1

> Current state only. Rewritten when reality changes; never a diary, never contradictory facts side by side. Read top to bottom at every session start. No secrets.

## Current Position

- Owner: **Master** (address as Master across all sessions)
- State: Modern soft-rounded e-commerce UI/UX redesign complete across Mobile, Tablet, and Desktop.
- Active Focus: Mobile responsiveness parity, transparent hero & lookbook t-shirt assets, verification on Vercel production server.

## Fixed Decisions

- Brand: Klasik Wardrobe (never change).
- Primary Accent: Purple `#7C3AED` / `#6D28D9` / `#EDE9FE`.
- Background: `#F7F7F8` soft off-white, cards `#FFFFFF` rounded-3xl (`24px`), images `#EDEDEF` rounded-2xl (`20px`).
- Fixed Catalog Pricing: ₦30k, ₦35k, ₦40k preserved across all views and checkout.
- Hero Carousel: Auto-slides every 5s, Black -> Purple -> White, touch/drag gesture support, strictly 3 dots, zero arrow buttons.
- Hero & Look Assets: 100% transparent cutouts without background pixels.

## Architecture

- Framework: Next.js 16 with Turbopack, Tailwind CSS, Framer Motion, Zustand cart store, Lucide icons.

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
