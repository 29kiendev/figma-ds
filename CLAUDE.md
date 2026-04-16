# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Figma plugin ("Typography DS") that automates typography token management for a design system across 3 responsive breakpoints (1280 / 1440 / 1920px). The plugin provides:
- **Tab "Chuẩn hoá"**: one-click creates Figma variables, upserts 46 named text styles, assigns those styles to all selected frames.
- **Tab "Tokens"**: edit token values (font size / line height / letter spacing) and style definitions (name, token, weight, lh%, ls%, textCase, mono) inline, then Apply to Figma. Reset restores hardcoded defaults. Data persists in the Figma file via `figma.root.setPluginData`.

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

### Plugin — `plugin/code.js`

**Startup sequence:**
```
loadTokenData()   → reads figma.root.getPluginData('tokenData'), fallback DEFAULT_SIZE/LH/LS
loadStyleData()   → reads figma.root.getPluginData('styleData'), fallback DEFAULT_STYLE_DEFS
buildFrameList()  → sends all FRAME nodes across all pages to UI
```

**"Chuẩn hoá" flow** (one or more frames selected):
```
setupVariables(fontStyles)
  → upsert "Typography" variable collection (3 modes: 1280 / 1440 / 1920)
  → create FLOAT variables for size/*, line-height/*, letter-spacing/*
  → create STRING variables for font-family/arial and font-style/*

createTextStyles(groupName, varMap)
  → upsert Figma local text styles named "[groupName]/[Role/Variant]"
  → deletes any existing styles with "[groupName]/" prefix no longer in STYLE_DEFS
  → each style binds fontSize to the matching size/* variable
  → lineHeight stored as % — scales proportionally, no variable needed
  → letterSpacing stored as % — same rationale

autoApplyStyles(frame, groupName)   [runs per frame]
  → walks all TEXT nodes in the frame
  → matches each node to a style by (fontSize × fontName.style) across all 3 BPs
  → sets node.textStyleId
```

Optional actions (checkboxes in Tab 1):
- **Nhân bản frame**: `duplicateFrames()` — clones first selected frame to 1440/1920, applies the matching variable mode
- **Tạo Guidelines**: `createGuideline()` — renders a typography spec table as a Figma frame

**Token data architecture:**
- `DEFAULT_SIZE`, `DEFAULT_LH`, `DEFAULT_LS` — immutable hardcoded values
- `SIZE_TOKENS`, `LH_TOKENS`, `LS_TOKENS` — runtime tables (empty `{}`), populated by `applyTokenData()`
- `applyTokenData(data)` — converts `{size: {'2xs': {'1280':10,...}}}` → prefixed format, rebuilds `SIZE_TO_SUFFIX` and `GUIDELINE_TOKENS`
- `loadTokenData()` / `saveTokenData(data)` — read/write `figma.root.getPluginData('tokenData')`

**Style data architecture:**
- `DEFAULT_STYLE_DEFS` — immutable array of 46 style definitions with `group` field
- `STYLE_DEFS` — runtime array, populated by `loadStyleData()`
- `loadStyleData()` / `saveStyleData(data)` — read/write `figma.root.getPluginData('styleData')`
- Each entry: `{ group, name, token, weight, lh?, ls?, textCase?, mono? }`

### UI — `plugin/ui.html`

Two tabs share a group name input at the top:

**Tab 1 — Chuẩn hoá:**
- Frame list with checkboxes (multi-select), "Chọn tất cả" toggle, ↻ refresh button
- Refresh preserves current selection (`prevSelectedIds`)
- Optional: nhân bản (breakpoint chips) + guidelines (sample text input)

**Tab 2 — Tokens:**
- 3 accordions: Font Size (open by default) / Line Height / Letter Spacing — each shows 8 tokens × 3 BP inputs
- 1 accordion: Styles — 10 sub-accordions by group (Page/Body/Form/Table/Button/Badge/Nav/Notif/Approval/Code)
  - Each style row: name input | token select | weight select | lh input | ls% input | Aa/AA case toggle | M mono toggle | ✕ delete
  - "+ Thêm style" per group
- Footer (sticky): **Apply ngay** → saves token+style data, runs setupVariables+createTextStyles | **Reset về default** → restores both to hardcoded

### Message protocol (UI ↔ plugin)

| UI → plugin | plugin → UI |
|---|---|
| `run { frameIds[], groupName, duplicate, breakpoints, guideline, sampleText }` | `done { text }` / `error { text }` |
| `getFrames` | `frames { data[] }` |
| `applyTokens { data, styleData, groupName }` | `tokensApplied { count }` / `tokensError { text }` |
| `resetTokens` | `tokenData { data }` + `styleData { data }` |
| `getTokens` | `tokenData { data }` |

### Text style matching (`autoApplyStyles`)

Since the same token maps to different pixel sizes at each breakpoint (e.g. `sm` = 11px at 1280, 12px at 1440, 13px at 1920), matching by absolute fontSize would miss nodes in 1440/1920 frames.

Build a reverse map by expanding every STYLE_DEF across all 3 breakpoints:
```
SIZE_TOKENS['size/sm']['1280'] = 11  →  sizeStyleMap['11|Regular'] includes sm styles
SIZE_TOKENS['size/sm']['1440'] = 12  →  sizeStyleMap['12|Regular'] includes sm styles
SIZE_TOKENS['size/sm']['1920'] = 13  →  sizeStyleMap['13|Regular'] includes sm styles
```

Disambiguation when multiple styles share the same size+fontStyle:
- `textCase: 'UPPER'` → requires `letterSpacing > 0` (Overline, Table/Header, Nav/Section)
- `lh >= 150` → requires node lineHeight ≥ 140% (Lead)
- `lh <= 110` → requires node lineHeight ≤ 130% (Button styles)
- Fallback: first entry in STYLE_DEFS order

### Token scale (defaults)

| Token | Sizes (1280/1440/1920) | Line heights  | Letter spacing         |
|-------|------------------------|---------------|------------------------|
| 2xs   | 10/10/11               | 16/16/16      | 0                      |
| xs    | 11/11/12               | 16/16/18      | 0                      |
| sm    | 11/12/13               | 16/18/20      | 0                      |
| base  | 13/14/16               | 20/22/24      | 0                      |
| md    | 14/15/17               | 20/22/26      | 0                      |
| lg    | 16/16/18               | 24/24/28      | 0                      |
| xl    | 18/20/22               | 28/30/34      | -0.2 / -0.3 / -0.4 px |
| 2xl   | 22/24/28               | 32/36/42      | -0.4 / -0.5 / -0.6 px |

### 46 text styles — groups and naming

Groups: **Page** (Display/Title/Subtitle/Overline) · **Body** (Body/Default~Strong~Secondary, Lead) · **Form** (Label, Input, Helper) · **Table** · **Button** · **Badge** (+ Tag) · **Nav** (+ Breadcrumb) · **Notif** (+ Toast/Tooltip) · **Approval** (+ Timeline) · **Code**

Full name format: `[groupName]/[Role/Variant]` e.g. `FAN Font/Body/Default`

### Why `fontFamily` is NOT bound to variables

Font family (Arial) is fixed across all breakpoints. Binding it to a variable shows `font-family/arial` in Figma's font family field, confusing designers. Set directly on `ts.fontName` instead.

### Node.js scripts

`lib/figma-api.js` — shared fetch wrapper for `api.figma.com/v1`.

`apply-styles.js` — read-only reporting. The Figma REST API **does not support PATCH for node properties** (no way to set `textStyleId` via REST). Actual assignment happens in the plugin only.

---

## Known limitations

- `Body/Secondary`, `Input/Placeholder`, `Label/Disabled` — identical typography to Default variants, differ only by color. Cannot be auto-assigned; must be set manually.
- `WEIGHT_MAP = { 400: 'Regular', 500: 'Bold', 600: 'Bold' }` because Arial has no Medium/SemiBold. If font changes, update `WEIGHT_MAP` and `FONT_MONO` at the top of `code.js`.
- Duplicate frame + Guidelines only apply to the **first** selected frame when multiple frames are selected.
- Deleting a style in Tab 2 and pressing Apply will remove that text style from Figma — any nodes referencing it lose their style assignment.
