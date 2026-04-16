# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Figma plugin ("Typography DS") that automates typography variable management across 3 responsive breakpoints (1280 / 1440 / 1920px). It creates/binds Figma local variables for font size, line height, letter spacing, font family, and font style — then duplicates frames per breakpoint with the correct variable mode applied.

There are also two standalone Node.js scripts (`create-variables.js`, `read-file.js`) that interact with the Figma REST API directly.

## Commands

```bash
# Analyze a Figma file via REST API
node read-file.js

# Create variable collection via REST API (run once, idempotent check built in)
node create-variables.js
```

Requires `.env` with `FIGMA_TOKEN` and `FIGMA_FILE_KEY`.

The plugin itself (`plugin/code.js` + `plugin/ui.html`) runs inside Figma — load it via **Plugins → Development → Import plugin from manifest** pointing to `plugin/manifest.json`.

## Architecture

### Plugin flow (`plugin/code.js`)

Three independent operations triggered from the UI, all within `figma.ui.onmessage`:

1. **Standardize** (`msg.standardize`): walks the selected frame, collects all Arial font styles → calls `setupVariables()` to upsert the `Typography` variable collection with 3 modes → calls `bindVariables()` to bind each TEXT node's fontSize/lineHeight/letterSpacing/fontFamily/fontStyle to variables.

2. **Duplicate** (`msg.duplicate`): calls `duplicateFrames()` to clone the 1280 source frame, resize to 1440/1920, and apply the matching variable mode via `setExplicitVariableModeForCollection`.

3. **Guideline** (`msg.guideline`): calls `createGuideline()` to render a typography spec table as a Figma frame.

### Token mapping chain

```
TEXT node fontSize
  → SIZE_TO_SUFFIX (size → token suffix, e.g. 13 → 'base')
  → varMap['size/base'], varMap['line-height/base']
  → SUFFIX_TO_LS   (suffix → letter-spacing key, e.g. 'xl' → 'letter-spacing/tight')
```

All token values live in `SIZE_TOKENS`, `LH_TOKENS`, `LS_TOKENS` at the top of `code.js`. These are **duplicated** from `lib/config.js` with a different structure — `lib/config.js` is only used by the Node.js scripts, not the plugin.

### Node.js scripts (`lib/`)

`lib/figma-api.js` wraps `fetch` for authenticated GET/POST to `api.figma.com/v1`. Both scripts are ES modules (`"type": "module"` in `package.json`).

## Known issues to fix

| Priority | Location | Issue |
|----------|----------|-------|
| HIGH | `plugin/code.js:33-36` | `SIZE_TO_SUFFIX` missing entries for **15, 17, 22, 24, 28** — text nodes with these sizes silently skip variable binding |
| HIGH | `plugin/code.js:374` | `res` is `undefined` if user runs Duplicate without Standardize — needs independent initialization |
| MED | `plugin/code.js:188,195,198,203` | Empty `catch(e){}` blocks swallow lineHeight/letterSpacing/fontFamily/fontStyle bind failures |
| MED | `create-variables.js:106` | Writes `variable-ids.json` but nothing reads it — either implement or remove |
| MED | `lib/config.js:18-25` | `SIZE_TO_TOKEN` also missing `16→'lg'` and sizes 15, 17, 22, 24, 28 |
| LOW | `plugin/code.js:78` | Checks both `COLLECTION_NAME` and hardcoded `'Font Size'` — legacy remnant |
| LOW | `plugin/code.js:92` | Typo: `'Thieu mode'` → `'Thiếu mode'` |

The complete token scale for reference (1280/1440/1920):
- 2xs: 10/10/11, xs: 11/11/12, sm: 11/12/13, base: 13/14/16
- md: 14/15/17, lg: 16/16/18, xl: 18/20/22, 2xl: 22/24/28
