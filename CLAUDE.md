# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Figma plugin ("Typography DS") that automates typography token management for a design system across 3 responsive breakpoints (1280 / 1440 / 1920px). The plugin provides:
- **Tab "Chuẩn hoá"**: one-click creates Figma variables, upserts 46 named text styles, assigns those styles to all selected frames.
- **Tab "Tokens"**: edit token values (font size / line height / letter spacing) and style definitions (name, token, weight, lh%, ls%, textCase, mono) inline, then Apply to Figma. Reset restores hardcoded defaults. Data persists in the Figma file via `figma.root.setPluginData`.
- **Tạo trang Demo**: creates 3 frames (`Demo 1280 / 1440 / 1920`) side by side on the current Figma page — 9 sections covering all 46 text roles, each text node bound to `textStyleId`, each frame set to the matching variable mode.

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
- Footer (sticky): **Apply ngay** → saves token+style data, runs setupVariables+createTextStyles | **Reset về default** → restores both to hardcoded | **Export CSS** → generates full CSS (variables + @media + `.text-*` classes) to clipboard

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
| xs    | 10/11/12               | 16/16/18      | 0                      |
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

### Export CSS (`generateCSS()` in ui.html)

Runs entirely in the UI — no message to plugin needed. Calls `collectTokenData()` + `collectStyleData()` and generates:
1. `:root { --size-*, --lh-*, --ls-* }` at 1280 (default)
2. `@media (min-width: 1440px)` and `@media (min-width: 1920px)` overrides
3. `.text-[name]` classes — name derived from `def.name.toLowerCase().replace(/\//g, '-')`
   - e.g. `Body/Default` → `.text-body-default`, `Table/Cell-Mono` → `.text-table-cell-mono`
4. Letter spacing from `def.ls` (Figma %) converted to `em`: `ls: 8` → `letter-spacing: 0.08em`

Result is copied to clipboard via `navigator.clipboard.writeText()` with `execCommand` fallback.

### Node.js scripts

`lib/figma-api.js` — shared fetch wrapper for `api.figma.com/v1`.

`apply-styles.js` — read-only reporting. The Figma REST API **does not support PATCH for node properties** (no way to set `textStyleId` via REST). Actual assignment happens in the plugin only.

---

### Duplicate frames (`duplicateFrames`)

- Clones each selected frame to 1440/1920 breakpoints (all selected frames, not just the first).
- Clone names: `Z-1440`, `Z-1920` (source frame name + breakpoint suffix).
- If existing clone with that name is found, it is removed before re-cloning.
- If the variable collection exists but is missing modes (e.g. file A created it with only 1280), `setupVariables` now auto-adds missing modes instead of throwing "Thiếu mode 1440".

### Typography Demo (`create-demo-page`)

- Sends `groupName` from the shared input in the plugin UI.
- Builds 3 frames (`Demo 1280 / 1440 / 1920`) with 9 sections mirroring `typography-roles-demo.html`.
- All auto layout uses **hug** sizing except the Table section (which uses STRETCH rows for fixed column widths).
- Section cards and divider rectangles use `layoutAlign = 'STRETCH'` to fill the BP frame width.
- Each text node gets `textStyleId` from local styles matching `groupName + '/' + def.name`.
- Each BP frame gets `setExplicitVariableModeForCollection` for the correct breakpoint.
- **Text template read-back**: before rebuilding, reads existing `Demo 1280` frame to preserve user-edited text (first occurrence per style key wins). Delete `Demo 1280` frame first to reset to defaults.

### Blog panel in `help.html`

`help.html` contains a mini-blog tab ("Đánh giá & Phân tích") — a dark-sidebar panel separate from the main docs. See **`BLOG.md`** for full instructions on adding new articles.

Quick reference:
- Add nav item before `<!-- BLOG_NAV_END -->` in the sidebar
- Add article div before `<!-- BLOG_ARTICLES_END -->` in the content area
- Article IDs: `a01`, `a02`... (sequential); `<div id="article-aXX">` + `<a onclick="showArticle('aXX', this)">`
- Available CSS: `.compare-table`, `.score-card.pro/.con`, `.rating-row`, `.verdict`, `.score-grid`
- To add a new article, tell Claude: **"Thêm bài blog mới vào help.html, chủ đề: [X], nội dung: [Y]"**

## Known limitations

- `Body/Secondary`, `Input/Placeholder`, `Label/Disabled` — identical typography to Default variants, differ only by color. Cannot be auto-assigned; must be set manually.
- `WEIGHT_MAP = { 400: 'Regular', 500: 'Bold', 600: 'Bold' }` because Arial has no Medium/SemiBold. If font changes, update `WEIGHT_MAP` and `FONT_MONO` at the top of `code.js`.
- Guidelines only apply to the **first** selected frame when multiple frames are selected.
- Deleting a style in Tab 2 and pressing Apply will remove that text style from Figma — any nodes referencing it lose their style assignment.
