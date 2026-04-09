# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VitePress-based documentation site for SystemVerilog learning notes. It covers core language concepts and verification features.

## Commands

```bash
# Install dependencies
pnpm install

# Start local dev server
pnpm docs:dev

# Build for production
pnpm docs:build

# Preview production build
pnpm docs:preview
```

Alternatively, use the justfile shortcuts: `just serve`, `just build`, `just preview`.

## Architecture

- Content lives in `docs/*.md` (schedule.md, assignment.md, clocking.md)
- VitePress config: `docs/.vitepress/config.mts`
- Site deploys automatically to GitHub Pages via GitHub Actions on push to main branch
- Base path is `/sv-notes/` for GitHub Pages deployment