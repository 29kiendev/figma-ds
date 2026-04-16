// Typography DS Plugin — with UI

var COLLECTION_NAME = 'Typography';
var TARGET_FONT     = 'Arial';
var MODES           = ['1280', '1440', '1920'];
var SKIP_SIZES      = [8, 9];
var FONT_MONO       = 'Courier New';
var WEIGHT_MAP      = { 400: 'Regular', 500: 'Bold', 600: 'Bold' };

// ─── Default token values (immutable — dùng để Reset) ────────────────────────
var DEFAULT_SIZE = {
  '2xs':  { '1280': 10, '1440': 10, '1920': 11 },
  'xs':   { '1280': 11, '1440': 11, '1920': 12 },
  'sm':   { '1280': 11, '1440': 12, '1920': 13 },
  'base': { '1280': 13, '1440': 14, '1920': 16 },
  'md':   { '1280': 14, '1440': 15, '1920': 17 },
  'lg':   { '1280': 16, '1440': 16, '1920': 18 },
  'xl':   { '1280': 18, '1440': 20, '1920': 22 },
  '2xl':  { '1280': 22, '1440': 24, '1920': 28 },
};
var DEFAULT_LH = {
  '2xs':  { '1280': 16, '1440': 16, '1920': 16 },
  'xs':   { '1280': 16, '1440': 16, '1920': 18 },
  'sm':   { '1280': 16, '1440': 18, '1920': 20 },
  'base': { '1280': 20, '1440': 22, '1920': 24 },
  'md':   { '1280': 20, '1440': 22, '1920': 26 },
  'lg':   { '1280': 24, '1440': 24, '1920': 28 },
  'xl':   { '1280': 28, '1440': 30, '1920': 34 },
  '2xl':  { '1280': 32, '1440': 36, '1920': 42 },
};
var DEFAULT_LS = {
  '0':       { '1280':  0.0, '1440':  0.0, '1920':  0.0 },
  'tight':   { '1280': -0.2, '1440': -0.3, '1920': -0.4 },
  'tighter': { '1280': -0.4, '1440': -0.5, '1920': -0.6 },
};

// ─── Runtime token tables (populated by loadTokenData on startup) ─────────────
// Các hàm trong plugin đọc từ đây — tự động cập nhật khi user thay đổi trong UI
var SIZE_TOKENS = {};
var LH_TOKENS   = {};
var LS_TOKENS   = {};

// SUFFIX_TO_LS: mối quan hệ suffix→ls-key, không phải giá trị số → giữ hardcoded
var SUFFIX_TO_LS = {
  '2xs': 'letter-spacing/0', 'xs':   'letter-spacing/0',
  'sm':  'letter-spacing/0', 'base': 'letter-spacing/0',
  'md':  'letter-spacing/0', 'lg':   'letter-spacing/0',
  'xl':  'letter-spacing/tight', '2xl': 'letter-spacing/tighter',
};

// Rebuilt từ token data mỗi khi data thay đổi
var SIZE_TO_SUFFIX  = {};
var GUIDELINE_TOKENS = [];

// ─── Token storage & runtime helpers ─────────────────────────────────────────

function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

function getDefaultTokenData() {
  return { size: deepCopy(DEFAULT_SIZE), lh: deepCopy(DEFAULT_LH), ls: deepCopy(DEFAULT_LS) };
}

// Áp dụng token data vào runtime variables + rebuild các bảng derived
function applyTokenData(data) {
  var sz = ['2xs','xs','sm','base','md','lg','xl','2xl'];
  var lk = ['0','tight','tighter'];
  var bps = ['1280','1440','1920'];
  SIZE_TOKENS = {}; LH_TOKENS = {}; LS_TOKENS = {};
  for (var i = 0; i < sz.length; i++) {
    SIZE_TOKENS['size/'        + sz[i]] = deepCopy(data.size[sz[i]]);
    LH_TOKENS['line-height/'   + sz[i]] = deepCopy(data.lh[sz[i]]);
  }
  for (var j = 0; j < lk.length; j++) {
    LS_TOKENS['letter-spacing/' + lk[j]] = deepCopy(data.ls[lk[j]]);
  }
  // Rebuild SIZE_TO_SUFFIX (last-write-wins cho duplicate sizes)
  SIZE_TO_SUFFIX = {};
  for (var si = 0; si < sz.length; si++) {
    for (var bi = 0; bi < bps.length; bi++) {
      SIZE_TO_SUFFIX[ SIZE_TOKENS['size/' + sz[si]][bps[bi]] ] = sz[si];
    }
  }
  // Rebuild GUIDELINE_TOKENS từ các giá trị hiện tại
  GUIDELINE_TOKENS = sz.map(function(s) {
    var lsKey = SUFFIX_TO_LS[s];
    return {
      name:  s,
      sizes: bps.map(function(bp){ return SIZE_TOKENS['size/'+s][bp]; }),
      lh:    bps.map(function(bp){ return LH_TOKENS['line-height/'+s][bp]; }),
      ls:    bps.map(function(bp){ return LS_TOKENS[lsKey][bp]; }),
    };
  });
}

// Đọc từ figma.root.getPluginData — nếu chưa có thì dùng default
function loadTokenData() {
  var stored = figma.root.getPluginData('tokenData');
  var data = stored ? JSON.parse(stored) : getDefaultTokenData();
  applyTokenData(data);
  return data;
}

// Lưu vào figma.root (nằm trong file Figma, dùng chung được với team) + apply
function saveTokenData(data) {
  figma.root.setPluginData('tokenData', JSON.stringify(data));
  applyTokenData(data);
}

function loadStyleData() {
  var stored = figma.root.getPluginData('styleData');
  var data = stored ? JSON.parse(stored) : deepCopy(DEFAULT_STYLE_DEFS);
  STYLE_DEFS = data;
  return data;
}
function saveStyleData(data) {
  STYLE_DEFS = data;
  figma.root.setPluginData('styleData', JSON.stringify(data));
}

var DEFAULT_STYLE_DEFS = [
  // PAGE LEVEL
  { group: 'Page',     name: 'Display',            token: '2xl',  weight: 600, lh: 130 },
  { group: 'Page',     name: 'Title',              token: 'xl',   weight: 600, lh: 130 },
  { group: 'Page',     name: 'Subtitle',           token: 'lg',   weight: 500, lh: 140 },
  { group: 'Page',     name: 'Overline',           token: 'xs',   weight: 600, textCase: 'UPPER', ls: 8 },
  // BODY
  { group: 'Body',     name: 'Body/Default',       token: 'base', weight: 400, lh: 170 },
  { group: 'Body',     name: 'Body/Strong',        token: 'base', weight: 600, lh: 170 },
  { group: 'Body',     name: 'Body/Secondary',     token: 'base', weight: 400, lh: 170 },
  { group: 'Body',     name: 'Lead',               token: 'md',   weight: 400, lh: 160 },
  // FORM
  { group: 'Form',     name: 'Label/Default',      token: 'sm',   weight: 500 },
  { group: 'Form',     name: 'Label/Required',     token: 'sm',   weight: 500 },
  { group: 'Form',     name: 'Label/Disabled',     token: 'sm',   weight: 500 },
  { group: 'Form',     name: 'Input/Value',        token: 'base', weight: 400 },
  { group: 'Form',     name: 'Input/Placeholder',  token: 'base', weight: 400 },
  { group: 'Form',     name: 'Helper/Default',     token: 'xs',   weight: 400 },
  { group: 'Form',     name: 'Helper/Error',       token: 'xs',   weight: 400 },
  { group: 'Form',     name: 'Helper/Success',     token: 'xs',   weight: 400 },
  // TABLE
  { group: 'Table',    name: 'Table/Header',       token: 'xs',   weight: 600, textCase: 'UPPER', ls: 5 },
  { group: 'Table',    name: 'Table/Cell',         token: 'sm',   weight: 400 },
  { group: 'Table',    name: 'Table/Cell-Bold',    token: 'sm',   weight: 600 },
  { group: 'Table',    name: 'Table/Cell-Sub',     token: 'xs',   weight: 400 },
  { group: 'Table',    name: 'Table/Cell-Mono',    token: 'xs',   weight: 400, mono: true },
  { group: 'Table',    name: 'Table/Footer',       token: 'xs',   weight: 500 },
  // BUTTON
  { group: 'Button',   name: 'Button/Large',       token: 'md',   weight: 500, lh: 100 },
  { group: 'Button',   name: 'Button/Default',     token: 'sm',   weight: 500, lh: 100 },
  { group: 'Button',   name: 'Button/Small',       token: 'xs',   weight: 500, lh: 100 },
  // BADGE & TAG
  { group: 'Badge',    name: 'Badge/Default',      token: 'xs',   weight: 500 },
  { group: 'Badge',    name: 'Badge/Dot',          token: 'xs',   weight: 500 },
  { group: 'Badge',    name: 'Tag',                token: 'xs',   weight: 500 },
  // NAVIGATION
  { group: 'Nav',      name: 'Nav/Item',           token: 'sm',   weight: 400 },
  { group: 'Nav',      name: 'Nav/Item-Active',    token: 'sm',   weight: 600 },
  { group: 'Nav',      name: 'Nav/Section',        token: 'xs',   weight: 600, textCase: 'UPPER', ls: 8 },
  { group: 'Nav',      name: 'Breadcrumb',         token: 'sm',   weight: 400 },
  { group: 'Nav',      name: 'Breadcrumb/Current', token: 'sm',   weight: 500 },
  // NOTIFICATION
  { group: 'Notif',    name: 'Notif/Title',        token: 'sm',   weight: 500 },
  { group: 'Notif',    name: 'Notif/Body',         token: 'sm',   weight: 400 },
  { group: 'Notif',    name: 'Notif/Time',         token: 'xs',   weight: 400 },
  { group: 'Notif',    name: 'Toast/Message',      token: 'sm',   weight: 400 },
  { group: 'Notif',    name: 'Tooltip',            token: 'xs',   weight: 400 },
  // APPROVAL & TIMELINE
  { group: 'Approval', name: 'Approval/Name',      token: 'base', weight: 600 },
  { group: 'Approval', name: 'Approval/Role',      token: 'sm',   weight: 400 },
  { group: 'Approval', name: 'Approval/Status',    token: 'sm',   weight: 500 },
  { group: 'Approval', name: 'Approval/Comment',   token: 'base', weight: 400, lh: 170 },
  { group: 'Approval', name: 'Approval/Date',      token: 'xs',   weight: 400, mono: true },
  { group: 'Approval', name: 'Timeline/Step',      token: 'sm',   weight: 500 },
  { group: 'Approval', name: 'Timeline/Desc',      token: 'xs',   weight: 400 },
  // CODE
  { group: 'Code',     name: 'Code/Reference',     token: 'xs',   weight: 500, mono: true },
];
var STYLE_DEFS = []; // runtime — populated by loadStyleData on startup

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inSkip(size) {
  for (var i = 0; i < SKIP_SIZES.length; i++) if (SKIP_SIZES[i] === size) return true;
  return false;
}
function buildModeMap(col) {
  var m = {};
  for (var i = 0; i < col.modes.length; i++) m[col.modes[i].name] = col.modes[i].modeId;
  return m;
}
function getOrCreate(col, type, name, existing) {
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].variableCollectionId === col.id && existing[i].name === name) return existing[i];
  }
  return figma.variables.createVariable(name, col, type);
}

// ─── Setup variables ──────────────────────────────────────────────────────────

function setupVariables(fontStyles) {
  var cols = figma.variables.getLocalVariableCollections();
  var col = null;
  for (var i = 0; i < cols.length; i++) {
    if (cols[i].name === COLLECTION_NAME) {
      col = cols[i];
      break;
    }
  }
  if (!col) {
    col = figma.variables.createVariableCollection(COLLECTION_NAME);
    col.renameMode(col.modes[0].modeId, '1280');
    col.addMode('1440');
    col.addMode('1920');
  }
  var modeMap = buildModeMap(col);
  for (var mi = 0; mi < MODES.length; mi++) {
    if (!modeMap[MODES[mi]]) throw new Error('Thiếu mode ' + MODES[mi]);
  }
  var fVars = figma.variables.getLocalVariables('FLOAT');
  var sVars = figma.variables.getLocalVariables('STRING');
  var varMap = {};

  var allFloatTokens = [SIZE_TOKENS, LH_TOKENS, LS_TOKENS];
  for (var ti = 0; ti < allFloatTokens.length; ti++) {
    var tbl = allFloatTokens[ti];
    var keys = Object.keys(tbl);
    for (var ki = 0; ki < keys.length; ki++) {
      var k = keys[ki];
      var v = getOrCreate(col, 'FLOAT', k, fVars);
      for (var bi = 0; bi < MODES.length; bi++) v.setValueForMode(modeMap[MODES[bi]], tbl[k][MODES[bi]]);
      varMap[k] = v;
    }
  }
  var fv = getOrCreate(col, 'STRING', 'font-family/arial', sVars);
  for (var fi = 0; fi < MODES.length; fi++) fv.setValueForMode(modeMap[MODES[fi]], TARGET_FONT);
  varMap['font-family/arial'] = fv;

  for (var fsi = 0; fsi < fontStyles.length; fsi++) {
    var style = fontStyles[fsi];
    var sk = 'font-style/' + style.toLowerCase().replace(/\s+/g, '-');
    var sv = getOrCreate(col, 'STRING', sk, sVars);
    for (var sbi = 0; sbi < MODES.length; sbi++) sv.setValueForMode(modeMap[MODES[sbi]], style);
    varMap[sk] = sv;
  }
  return { col: col, modeMap: modeMap, varMap: varMap };
}

// ─── Collect font styles ──────────────────────────────────────────────────────

function collectFontStyles(frame) {
  var set = {};
  function walk(n) {
    if (n.type === 'TEXT') {
      var fam = n.fontName === figma.mixed
        ? (function(){ try { return n.getRangeFontName(0,1).family; } catch(e){ return null; } })()
        : n.fontName.family;
      if (fam === TARGET_FONT) {
        var sty = n.fontName === figma.mixed
          ? (function(){ try { return n.getRangeFontName(0,1).style; } catch(e){ return null; } })()
          : n.fontName.style;
        if (sty) set[sty] = true;
      }
    }
    if (n.children) for (var i = 0; i < n.children.length; i++) walk(n.children[i]);
  }
  walk(frame);
  return Object.keys(set);
}

// ─── Duplicate frames ─────────────────────────────────────────────────────────

function duplicateFrames(sourceFrame, col, modeMap, breakpoints) {
  var parent = sourceFrame.parent;
  var GAP = 80;
  var bpWidths = { '1280': 1280, '1440': 1440, '1920': 1920 };
  var results = [];
  var lastX = sourceFrame.x + sourceFrame.width;

  for (var i = 0; i < breakpoints.length; i++) {
    var bp = breakpoints[i];
    if (bp === '1280') continue; // source is already 1280
    var children = parent.children;
    for (var ci = 0; ci < children.length; ci++) {
      if (children[ci].type === 'FRAME' && children[ci].name === bp) { children[ci].remove(); break; }
    }
    var clone = sourceFrame.clone();
    clone.name = bp;
    clone.resize(bpWidths[bp], sourceFrame.height);
    clone.setExplicitVariableModeForCollection(col, modeMap[bp]);
    clone.x = lastX + GAP;
    clone.y = sourceFrame.y;
    lastX = clone.x + clone.width;
    results.push(bp + '(' + clone.width + 'x' + clone.height + ')');
  }
  return results;
}

// ─── Create guideline ─────────────────────────────────────────────────────────

async function createGuideline(sampleText) {
  var FONT_REG  = { family: 'Arial', style: 'Regular' };
  var FONT_BOLD = { family: 'Arial', style: 'Bold' };
  await figma.loadFontAsync(FONT_REG);
  await figma.loadFontAsync(FONT_BOLD);

  var C_BG     = { r:0.97, g:0.97, b:0.98 };
  var C_WHITE  = { r:1,    g:1,    b:1    };
  var C_HEAD   = { r:0.06, g:0.06, b:0.08 };
  var C_LABEL  = { r:0.45, g:0.45, b:0.50 };
  var C_SAMPLE = { r:0.08, g:0.08, b:0.10 };
  var C_BORDER = { r:0.88, g:0.88, b:0.90 };
  var C_ACCENT = { r:0.24, g:0.52, b:1.00 };
  var C_TAGBG  = { r:0.93, g:0.96, b:1.00 };

  var COL_TOKEN = 120, COL_BP = 280, ROW_H = 90, PAD = 48, GAP = 1;
  var totalW = PAD*2 + COL_TOKEN + 3*COL_BP + 3*GAP;
  var totalH = PAD*2 + 80 + 16 + 50 + GAP + GUIDELINE_TOKENS.length*(ROW_H+GAP);

  function rgb(c) { return [{ type:'SOLID', color:c }]; }
  function addText(str, sz, font, color, parent) {
    var t = figma.createText();
    parent.appendChild(t);
    t.fontName = font; t.fontSize = sz; t.characters = str;
    t.fills = rgb(color); t.textAutoResize = 'WIDTH_AND_HEIGHT';
    return t;
  }
  function addRect(w, h, color, parent) {
    var r = figma.createRectangle();
    parent.appendChild(r); r.resize(w,h); r.fills = rgb(color); return r;
  }
  function addFrame(w, h, color, parent) {
    var f = figma.createFrame();
    if (parent) parent.appendChild(f);
    f.resize(w,h); f.fills = color ? rgb(color) : []; f.clipsContent = true; return f;
  }

  var root = addFrame(totalW, totalH, C_BG, null);
  root.name = 'Typography Guidelines';

  var ttl = addText('Typography Guidelines', 28, FONT_BOLD, C_HEAD, root);
  ttl.x = PAD; ttl.y = PAD;
  var sub = addText('Font: Arial  ·  8 tokens  ·  1280 / 1440 / 1920', 13, FONT_REG, C_LABEL, root);
  sub.x = PAD; sub.y = PAD + 38;

  var hy = PAD + 96;
  var hbg = addRect(totalW, 50, C_WHITE, root); hbg.x = 0; hbg.y = hy;
  var hNames = ['Token','1280','1440','1920'];
  var hx = PAD;
  for (var hi = 0; hi < hNames.length; hi++) {
    var hl = addText(hNames[hi], 11, FONT_BOLD, C_LABEL, root);
    hl.x = hx; hl.y = hy + 18;
    hx += hi === 0 ? COL_TOKEN : COL_BP;
  }
  var hb = addRect(totalW, GAP, C_BORDER, root); hb.x = 0; hb.y = hy + 50;

  for (var ri = 0; ri < GUIDELINE_TOKENS.length; ri++) {
    var tok = GUIDELINE_TOKENS[ri];
    var ry = PAD + 96 + 50 + GAP + ri*(ROW_H+GAP);

    var rbg = addRect(totalW, ROW_H, C_WHITE, root); rbg.x = 0; rbg.y = ry;

    var tagW = 52, tagH = 24;
    var tag = addFrame(tagW, tagH, C_TAGBG, root);
    tag.x = PAD; tag.y = ry + (ROW_H-tagH)/2; tag.cornerRadius = 6;
    var tl = addText(tok.name, 11, FONT_BOLD, C_ACCENT, tag);
    tl.x = (tagW - tl.width)/2; tl.y = (tagH - tl.height)/2;

    for (var bi = 0; bi < 3; bi++) {
      var cx = PAD + COL_TOKEN + bi*(COL_BP+GAP);
      var sz = tok.sizes[bi], lh = tok.lh[bi], ls = tok.ls[bi];
      var sample = addText(sampleText, sz, FONT_BOLD, C_SAMPLE, root);
      sample.x = cx; sample.y = ry + 12;
      var lsStr = ls === 0 ? '0' : ls.toString();
      var spec = addText(sz+'px  ·  lh '+lh+'  ·  ls '+lsStr, 10, FONT_REG, C_LABEL, root);
      spec.x = cx; spec.y = ry + ROW_H - 22;
    }
    var rb = addRect(totalW, GAP, C_BORDER, root); rb.x = 0; rb.y = ry + ROW_H;
  }

  var dx = PAD + COL_TOKEN;
  for (var di = 0; di < 3; di++) {
    var dv = addRect(GAP, totalH - PAD - 96, C_BORDER, root); dv.x = dx; dv.y = PAD + 96;
    dx += COL_BP + GAP;
  }

  figma.currentPage.appendChild(root);
  root.x = 200; root.y = 200;
  figma.viewport.scrollAndZoomIntoView([root]);
}

// ─── Create text styles ───────────────────────────────────────────────────────

async function createTextStyles(groupName, varMap) {
  // Pre-load all unique (family, style) combinations
  var fontsToLoad = {};
  for (var i = 0; i < STYLE_DEFS.length; i++) {
    var d = STYLE_DEFS[i];
    var fam = d.mono ? FONT_MONO : TARGET_FONT;
    var wgt = WEIGHT_MAP[d.weight] || 'Regular';
    fontsToLoad[fam + '|' + wgt] = { family: fam, style: wgt };
  }
  var fkeys = Object.keys(fontsToLoad);
  for (var fi = 0; fi < fkeys.length; fi++) {
    try { await figma.loadFontAsync(fontsToLoad[fkeys[fi]]); } catch(e) {}
  }

  var existing = figma.getLocalTextStyles();
  var existingMap = {};
  for (var ei = 0; ei < existing.length; ei++) existingMap[existing[ei].name] = existing[ei];

  var count = 0;
  var activeNames = {};
  for (var si = 0; si < STYLE_DEFS.length; si++) {
    var def = STYLE_DEFS[si];
    var styleName = groupName + '/' + def.name;
    activeNames[styleName] = true;
    var ts = existingMap[styleName] || figma.createTextStyle();
    ts.name = styleName;
    ts.fontName = { family: def.mono ? FONT_MONO : TARGET_FONT, style: WEIGHT_MAP[def.weight] || 'Regular' };
    ts.fontSize = SIZE_TOKENS['size/' + def.token]['1280'];
    if (varMap && varMap['size/' + def.token]) {
      try { ts.setBoundVariable('fontSize', varMap['size/' + def.token]); } catch(e) {}
    }
    ts.lineHeight     = def.lh ? { unit: 'PERCENT', value: def.lh } : { unit: 'AUTO' };
    ts.letterSpacing  = def.ls ? { unit: 'PERCENT', value: def.ls } : { unit: 'PERCENT', value: 0 };
    ts.textCase       = def.textCase || 'ORIGINAL';
    count++;
  }
  // Xoá styles thuộc groupName nhưng không còn trong STYLE_DEFS
  var prefix = groupName + '/';
  for (var di = 0; di < existing.length; di++) {
    var ets = existing[di];
    if (ets.name.indexOf(prefix) === 0 && !activeNames[ets.name]) {
      try { ets.remove(); } catch(e) {}
    }
  }
  return count;
}

// ─── Auto-apply text styles ───────────────────────────────────────────────────

function autoApplyStyles(frame, groupName) {
  // Style name → id map
  var localStyles = figma.getLocalTextStyles();
  var styleIdMap = {};
  for (var si = 0; si < localStyles.length; si++) {
    styleIdMap[localStyles[si].name] = localStyles[si].id;
  }

  // Build reverse map: 'fontSize|fontStyle' → [STYLE_DEFS entries]
  // Expand each STYLE_DEF to ALL breakpoint sizes so we cover 1280/1440/1920
  var sizeStyleMap = {};
  var bps = ['1280', '1440', '1920'];
  for (var di = 0; di < STYLE_DEFS.length; di++) {
    var def = STYLE_DEFS[di];
    var fsStr = WEIGHT_MAP[def.weight] || 'Regular';
    var sizeKey = 'size/' + def.token;
    if (!SIZE_TOKENS[sizeKey]) continue;
    for (var bi = 0; bi < bps.length; bi++) {
      var sz = SIZE_TOKENS[sizeKey][bps[bi]];
      var mk = sz + '|' + fsStr;
      if (!sizeStyleMap[mk]) sizeStyleMap[mk] = [];
      var dup = false;
      for (var xi = 0; xi < sizeStyleMap[mk].length; xi++) {
        if (sizeStyleMap[mk][xi].name === def.name) { dup = true; break; }
      }
      if (!dup) sizeStyleMap[mk].push(def);
    }
  }

  var applied = 0, skipped = 0;
  var skipReasons = {};

  function walk(n) {
    if (n.type === 'TEXT') {
      if (n.fontName === figma.mixed || n.fontSize === figma.mixed) {
        skipped++;
        skipReasons['mixed font'] = (skipReasons['mixed font'] || 0) + 1;
        return;
      }
      if (n.fontName.family !== TARGET_FONT) {
        skipped++;
        var fk = n.fontName.family;
        skipReasons[fk] = (skipReasons[fk] || 0) + 1;
        return;
      }

      var mk = n.fontSize + '|' + n.fontName.style;
      var candidates = sizeStyleMap[mk];
      if (!candidates || candidates.length === 0) {
        skipped++;
        var sk = 'size ' + n.fontSize + ' ' + n.fontName.style;
        skipReasons[sk] = (skipReasons[sk] || 0) + 1;
        return;
      }

      // Disambiguate using lineHeight and letterSpacing
      var lh = n.lineHeight;
      var lhPct = lh.unit === 'PERCENT' ? lh.value
                : lh.unit === 'PIXELS'  ? Math.round((lh.value / n.fontSize) * 100)
                : null;
      var ls = n.letterSpacing;
      var hasLS = ls.unit === 'PERCENT' ? ls.value > 0.001
                : ls.unit === 'PIXELS'  ? Math.abs(ls.value) > 0.001
                : false;

      var chosen = null;
      for (var ci = 0; ci < candidates.length; ci++) {
        var c = candidates[ci];
        if (c.textCase === 'UPPER' && !hasLS) continue;      // Overline/Header cần ls
        if (c.lh >= 150 && (!lhPct || lhPct < 140)) continue; // Lead cần lh cao
        if (c.lh <= 110 && lhPct && lhPct > 130) continue;    // Button cần lh thấp
        chosen = c; break;
      }
      if (!chosen) chosen = candidates[0]; // fallback: style phổ biến nhất cho size này

      var fullName = groupName + '/' + chosen.name;
      var styleId = styleIdMap[fullName];
      if (!styleId) {
        skipped++;
        skipReasons['style chưa tạo'] = (skipReasons['style chưa tạo'] || 0) + 1;
        return;
      }
      try { n.textStyleId = styleId; applied++; }
      catch(e) { skipped++; }
    }
    if (n.children) for (var i = 0; i < n.children.length; i++) walk(n.children[i]);
  }

  walk(frame);
  return { applied: applied, skipped: skipped, skipReasons: skipReasons };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function buildFrameList() {
  var list = [];
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var pg = figma.root.children[pi];
    var pgch = pg.children || [];
    for (var ci = 0; ci < pgch.length; ci++) {
      var n = pgch[ci];
      if (n.type === 'FRAME') {
        list.push({ id: n.id, name: n.name, page: pg.name,
          w: Math.round(n.width), h: Math.round(n.height) });
      }
    }
  }
  return list;
}

figma.showUI(__html__, { width: 320, height: 560 });

var currentTokenData = loadTokenData();
var currentStyleData = loadStyleData();

figma.ui.postMessage({ type: 'frames', data: buildFrameList() });
figma.ui.postMessage({ type: 'tokenData', data: currentTokenData });
figma.ui.postMessage({ type: 'styleData', data: currentStyleData });

figma.ui.onmessage = async function(msg) {
  // ── Refresh frame list ───────────────────────────────────────────
  if (msg.type === 'getFrames') {
    figma.ui.postMessage({ type: 'frames', data: buildFrameList() });
    return;
  }

  // ── Token tab handlers ───────────────────────────────────────────
  if (msg.type === 'getTokens') {
    figma.ui.postMessage({ type: 'tokenData', data: currentTokenData });
    return;
  }
  if (msg.type === 'applyTokens') {
    try {
      currentTokenData = msg.data;
      saveTokenData(currentTokenData);
      if (msg.styleData) { currentStyleData = msg.styleData; saveStyleData(currentStyleData); }
      var res2 = setupVariables([]);
      var cnt = await createTextStyles(msg.groupName || 'FAN Font', res2.varMap);
      figma.ui.postMessage({ type: 'tokensApplied', count: cnt });
    } catch(e) {
      figma.ui.postMessage({ type: 'tokensError', text: e.message });
    }
    return;
  }
  if (msg.type === 'resetTokens') {
    currentTokenData = getDefaultTokenData();
    saveTokenData(currentTokenData);
    currentStyleData = deepCopy(DEFAULT_STYLE_DEFS);
    saveStyleData(currentStyleData);
    figma.ui.postMessage({ type: 'tokenData', data: currentTokenData });
    figma.ui.postMessage({ type: 'styleData', data: currentStyleData });
    return;
  }

  if (msg.type !== 'run') return;

  var frameIds = msg.frameIds || (msg.frameId ? [msg.frameId] : []);
  if (frameIds.length === 0) {
    figma.ui.postMessage({ type: 'error', text: 'Chọn ít nhất 1 frame.' }); return;
  }

  var groupName = msg.groupName || 'FAN Font';
  var lines = [];

  // ── Thu thập font styles từ tất cả frames được chọn ───────────────────────
  var fontStyleSet = {};
  for (var cfi = 0; cfi < frameIds.length; cfi++) {
    var cf = figma.getNodeById(frameIds[cfi]);
    if (cf) {
      var fss = collectFontStyles(cf);
      for (var fsi2 = 0; fsi2 < fss.length; fsi2++) fontStyleSet[fss[fsi2]] = true;
    }
  }

  // ── Setup variables + text styles (chạy 1 lần cho tất cả frames) ──────────
  var res;
  try { res = setupVariables(Object.keys(fontStyleSet)); }
  catch(e) { figma.ui.postMessage({ type: 'error', text: 'Lỗi variables: ' + e.message }); return; }

  var styleCount = await createTextStyles(groupName, res.varMap);
  lines.push('✓ ' + styleCount + ' text styles');

  // ── Gán styles từng frame ──────────────────────────────────────────────────
  for (var fi = 0; fi < frameIds.length; fi++) {
    var frame = figma.getNodeById(frameIds[fi]);
    if (!frame || frame.type !== 'FRAME') {
      lines.push('✗ Frame #' + (fi + 1) + ': không tìm thấy'); continue;
    }
    frame.setExplicitVariableModeForCollection(res.col, res.modeMap['1280']);
    var ar = autoApplyStyles(frame, groupName);

    if (frameIds.length === 1) {
      var applyLine = '✓ Gán: ' + ar.applied + ' nodes';
      if (ar.skipped > 0) {
        var topReasons = Object.entries(ar.skipReasons)
          .sort(function(a,b){ return b[1]-a[1]; }).slice(0,3)
          .map(function(e){ return e[1]+'× '+e[0]; });
        applyLine += '  ✗ bỏ qua: ' + ar.skipped + ' (' + topReasons.join(', ') + ')';
      }
      lines.push(applyLine);
    } else {
      var fLine = '[' + frame.name + '] ✓' + ar.applied + ' node';
      if (ar.skipped > 0) fLine += ' ✗' + ar.skipped;
      lines.push(fLine);
    }
  }

  // ── Duplicate (áp dụng cho frame đầu tiên) ────────────────────────────────
  if (msg.duplicate && msg.breakpoints.length > 0) {
    var srcFrame = figma.getNodeById(frameIds[0]);
    if (srcFrame && srcFrame.type === 'FRAME') {
      var cloned = duplicateFrames(srcFrame, res.col, res.modeMap, msg.breakpoints);
      if (cloned.length > 0) lines.push('✓ Frames: ' + cloned.join(', '));
    }
  }

  // ── Guideline ─────────────────────────────────────────────────────────────
  if (msg.guideline) {
    await createGuideline(msg.sampleText || 'Ag');
    lines.push('✓ Guidelines đã tạo');
  }

  figma.ui.postMessage({ type: 'done', text: lines.join('\n') });
};
