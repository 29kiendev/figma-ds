# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Figma plugin ("Typography DS") that automates typography token management for a design system across 3 responsive breakpoints (1280 / 1440 / 1920px). One click does everything: creates Figma local variables, creates 46 named text styles, assigns those styles to all text nodes in the selected frame, and optionally duplicates the frame per breakpoint.

There are also Node.js scripts (`create-variables.js`, `read-file.js`, `apply-styles.js`) for REST API operations.

## Commands

```bash
# Analyze a Figma file — lists text nodes, font sizes, styles
node read-file.js           # or: npm run read

# Report text node → style mapping (read-only, does not modify Figma)
node apply-styles.js        # or: npm run apply

# Create variable collection via REST API (idempotent, run once)
node create-variables.js
```

Requires `.env` with `FIGMA_TOKEN` and `FIGMA_FILE_KEY`.

The plugin runs inside Figma — load via **Plugins → Development → Import plugin from manifest** pointing to `plugin/manifest.json`.

## Architecture

### Plugin — one-click flow (`plugin/code.js`)

Pressing **"Chuẩn hoá"** in the UI always runs all 3 steps in sequence:

```
setupVariables(frame)
  → upsert "Typography" variable collection (3 modes: 1280 / 1440 / 1920)
  → create FLOAT variables for size/*, line-height/*, letter-spacing/*
  → create STRING variables for font-style/*

createTextStyles(groupName, varMap)
  → upsert 46 Figma local text styles named "[groupName]/[Role/Variant]"
  → each style binds fontSize to the matching size/* variable
    (so switching variable mode changes font size responsively)
  → lineHeight stored as % (e.g. 170%) — scales proportionally, no variable needed
  → letterSpacing stored as % (e.g. 8%) — same rationale

autoApplyStyles(frame, groupName)
  → walks all TEXT nodes in the selected frame
  → matches each node to a style by (fontSize × fontName.style)
  → sets node.textStyleId — this is what makes the style appear in Figma's text panel
```

Optional actions (checkboxes in UI):
- **Nhân bản frame**: `duplicateFrames()` — clones frame to 1440/1920 widths, applies the matching variable mode via `setExplicitVariableModeForCollection`
- **Tạo Guidelines**: `createGuideline()` — renders a typography spec table as a Figma frame

### Why text styles + variables, not variables alone

Variables make fontSize responsive across breakpoints. Text styles make the design system usable for designers: they can select `FAN Font/Body/Default` from the style picker and the node's size/weight/lineHeight/letterSpacing are all locked and labeled. Variables and text styles work together — the text style's `fontSize` is bound to the variable, so switching the frame's variable mode updates the actual size.

### Text style matching (`autoApplyStyles`)

Since the same token maps to different pixel sizes at each breakpoint (e.g. `sm` = 11px at 1280, 12px at 1440, 13px at 1920), matching by absolute fontSize would miss nodes in 1440/1920 frames.

Solution: at runtime, build a reverse map by expanding every entry in `STYLE_DEFS` across all 3 breakpoints:

```
SIZE_TOKENS['size/sm']['1280'] = 11  →  sizeStyleMap['11|Regular'] includes sm styles
SIZE_TOKENS['size/sm']['1440'] = 12  →  sizeStyleMap['12|Regular'] includes sm styles
SIZE_TOKENS['size/sm']['1920'] = 13  →  sizeStyleMap['13|Regular'] includes sm styles
```

Disambiguation when multiple styles share the same size+fontStyle:
- `textCase: 'UPPER'` → requires `letterSpacing > 0` (Overline, Table/Header, Nav/Section)
- `lh >= 150` → requires node lineHeight ≥ 140% (Lead)
- `lh <= 110` → requires node lineHeight ≤ 130% (Button styles)
- Fallback: first entry in `STYLE_DEFS` order (most generic style for that size wins)

### Token scale (1280 / 1440 / 1920)

| Token | Sizes      | Line heights  | Letter spacing         |
|-------|-----------|---------------|------------------------|
| 2xs   | 10/10/11  | 16/16/16      | 0                      |
| xs    | 11/11/12  | 16/16/18      | 0                      |
| sm    | 11/12/13  | 16/18/20      | 0                      |
| base  | 13/14/16  | 20/22/24      | 0                      |
| md    | 14/15/17  | 20/22/26      | 0                      |
| lg    | 16/16/18  | 24/24/28      | 0                      |
| xl    | 18/20/22  | 28/30/34      | -0.2 / -0.3 / -0.4 px |
| 2xl   | 22/24/28  | 32/36/42      | -0.4 / -0.5 / -0.6 px |

### 46 text styles — naming convention `[Group]/[Role/Variant]`

Roles: Display, Title, Subtitle, Overline, Body/Default, Body/Strong, Body/Secondary, Lead, Label/Default~Disabled, Input/Value~Placeholder, Helper/Default~Error~Success, Table/Header~Cell~Cell-Bold~Cell-Sub~Cell-Mono~Footer, Button/Large~Default~Small, Badge/Default~Dot, Tag, Nav/Item~Item-Active~Section, Breadcrumb~Current, Notif/Title~Body~Time, Toast/Message, Tooltip, Approval/Name~Role~Status~Comment~Date, Timeline/Step~Desc, Code/Reference

### Why `fontFamily` is NOT bound to variables

Font family (Arial) is fixed across all breakpoints and all roles. Binding it to a variable adds `font-family/arial` as a variable name in Figma's font family field, which is confusing to designers. Font family is set directly on the text style's `fontName` property instead.

### Node.js scripts

`lib/figma-api.js` — shared fetch wrapper for `api.figma.com/v1` (GET + POST).

`apply-styles.js` — read-only reporting script. The Figma REST API **does not support PATCH for node properties** (no way to set `textStyleId` via REST). This script reads text nodes, matches rules, and prints what *would* be applied. Actual assignment happens in the plugin.

### Known limitations

- `Body/Secondary`, `Input/Placeholder`, `Label/Disabled` — identical typography to their Default variants, differ only by color. Cannot be auto-assigned; must be set manually.
- `WEIGHT_MAP` maps `{ 400: 'Regular', 500: 'Bold', 600: 'Bold' }` because Arial has no Medium/SemiBold. If the project font changes to one with more weights, update `WEIGHT_MAP` and `FONT_MONO` at the top of `code.js`.
- `bindVariables()` still exists in `code.js` but is no longer called in the main flow. It was the old approach of binding variables directly to nodes; text styles with variable bindings replace it.
