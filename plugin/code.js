// Typography DS Plugin — with UI

var COLLECTION_NAME = 'Typography';
var TARGET_FONT     = 'Arial';
var MODES           = ['1280', '1440', '1920'];
var SKIP_SIZES      = [8, 9];
var FONT_MONO       = 'Courier New';
var WEIGHT_MAP      = { 400: 'Regular', 500: 'Bold', 600: 'Bold' };

// ─── Default token values (immutable — dùng để Reset) ────────────────────────
var DEFAULT_SIZE = {
  'xs':   { '1280': 10, '1440': 11, '1920': 12 },
  'sm':   { '1280': 11, '1440': 12, '1920': 13 },
  'base': { '1280': 13, '1440': 14, '1920': 16 },
  'md':   { '1280': 14, '1440': 15, '1920': 17 },
  'lg':   { '1280': 16, '1440': 16, '1920': 18 },
  'xl':   { '1280': 18, '1440': 20, '1920': 22 },
  '2xl':  { '1280': 22, '1440': 24, '1920': 28 },
};
var DEFAULT_LH = {
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
  'xs':  'letter-spacing/0', 'sm':   'letter-spacing/0',
  'base': 'letter-spacing/0',
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
  var sz = ['xs','sm','base','md','lg','xl','2xl'];
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
  } else {
    // Ensure all 3 modes exist (collection may have been created with fewer modes)
    var existingNames = col.modes.map(function(m) { return m.name; });
    if (existingNames.indexOf('1280') === -1) col.renameMode(col.modes[0].modeId, '1280');
    if (existingNames.indexOf('1440') === -1) col.addMode('1440');
    if (existingNames.indexOf('1920') === -1) col.addMode('1920');
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
    var cloneName = sourceFrame.name + '-' + bp;
    var children = parent.children;
    for (var ci = 0; ci < children.length; ci++) {
      if (children[ci].type === 'FRAME' && children[ci].name === cloneName) { children[ci].remove(); break; }
    }
    var clone = sourceFrame.clone();
    clone.name = cloneName;
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

  // ── Create Demo Page ──────────────────────────────────────────────
  if (msg.type === 'create-demo-page') {
    try {
      await Promise.all([
        figma.loadFontAsync({ family: 'Arial', style: 'Regular' }),
        figma.loadFontAsync({ family: 'Arial', style: 'Bold' }),
        figma.loadFontAsync({ family: 'Courier New', style: 'Regular' }),
      ]);

      var gn = msg.groupName || 'FAN Font';

      // Build styleMap: 'Display' -> styleId, 'Body/Default' -> styleId …
      var styleMap = {};
      var allLS = figma.getLocalTextStyles();
      var gnPre = gn + '/';
      for (var si0 = 0; si0 < allLS.length; si0++) {
        var sn0 = allLS[si0].name;
        if (sn0.indexOf(gnPre) === 0) styleMap[sn0.slice(gnPre.length)] = allLS[si0].id;
      }

      // Get variable collection for mode binding (idempotent)
      var vsR = null;
      try { vsR = setupVariables([]); } catch(e) { vsR = null; }

      // ── Color palette ───────────────────────────────────────────
      var C = {
        bg:       {r:.969,g:.965,b:.953}, white:    {r:1,   g:1,   b:1   },
        s2:       {r:.953,g:.949,b:.937}, s3:       {r:.925,g:.918,b:.898},
        border:   {r:.886,g:.878,b:.855}, borderMd: {r:.784,g:.776,b:.749},
        t1:       {r:.102,g:.098,b:.086}, t2:       {r:.290,g:.282,b:.263},
        t3:       {r:.478,g:.471,b:.439}, t4:       {r:.659,g:.651,b:.624},
        accent:   {r:.176,g:.420,b:.894}, acBg:     {r:.922,g:.941,b:.992},
        success:  {r:.110,g:.478,b:.306}, sucBg:    {r:.910,g:.961,b:.933},
        warn:     {r:.588,g:.345,b:.039}, warnBg:   {r:.996,g:.953,b:.886},
        danger:   {r:.851,g:.251,b:.251}, danBg:    {r:.996,g:.949,b:.949},
        dark:     {r:.102,g:.098,b:.086},
      };
      var FR = {family:'Arial',       style:'Regular'};
      var FB = {family:'Arial',       style:'Bold'};
      var FM = {family:'Courier New', style:'Regular'};
      function sol(c)  { return [{type:'SOLID',color:c}]; }
      function noF()   { return []; }

      // ── Core helpers ────────────────────────────────────────────

      // Auto-layout frame
      function aF(opts, parent) {
        var f = figma.createFrame();
        f.fills  = opts.fill  !== undefined ? opts.fill  : noF();
        f.strokes= opts.stroke? [{type:'SOLID',color:opts.stroke}] : [];
        if (opts.stroke) { f.strokeWeight = opts.sw||1; f.strokeAlign='INSIDE'; }
        f.cornerRadius = opts.r || 0;
        f.layoutMode   = opts.dir || 'VERTICAL';
        f.primaryAxisSizingMode   = opts.hug     ? 'AUTO' : 'FIXED';
        f.counterAxisSizingMode   = opts.hugCross? 'AUTO' : 'FIXED';
        var W = opts.w || 100, H = opts.h || 100;
        f.resize(W, H);
        f.paddingTop    = opts.pt !== undefined ? opts.pt : (opts.p !== undefined ? opts.p : 0);
        f.paddingBottom = opts.pb !== undefined ? opts.pb : (opts.p !== undefined ? opts.p : 0);
        f.paddingLeft   = opts.pl !== undefined ? opts.pl : (opts.p !== undefined ? opts.p : 0);
        f.paddingRight  = opts.pr !== undefined ? opts.pr : (opts.p !== undefined ? opts.p : 0);
        f.itemSpacing   = opts.gap || 0;
        f.clipsContent  = !!opts.clip;
        if (opts.align) f.counterAxisAlignItems = opts.align;
        if (opts.ja)    f.primaryAxisAlignItems  = opts.ja;
        if (opts.la)    f.layoutAlign = opts.la;
        if (opts.grow !== undefined) f.layoutGrow = opts.grow;
        if (parent) parent.appendChild(f);
        if (opts.name) f.name = opts.name;
        return f;
      }

      // Text node
      function aT(chars, opts, parent) {
        var t = figma.createText();
        t.fontName = opts.font || FR;
        t.fontSize = opts.sz  || 13;
        t.characters = chars;
        t.fills = sol(opts.color || C.t1);
        t.textAutoResize = opts.fixed ? 'HEIGHT' : 'WIDTH_AND_HEIGHT';
        if (opts.fixed) t.resize(opts.fixed, 20);
        if (opts.lh)    t.lineHeight   = {unit:'PERCENT', value: opts.lh};
        if (opts.ls !== undefined) t.letterSpacing = {unit:'PERCENT', value: opts.ls};
        if (opts.upper) t.textCase = 'UPPER';
        if (opts.la)    t.layoutAlign = opts.la;
        if (opts.grow !== undefined) t.layoutGrow = opts.grow;
        if (opts.key && styleMap[opts.key]) t.textStyleId = styleMap[opts.key];
        if (parent) parent.appendChild(t);
        return t;
      }

      // Role badge chip (blue label)
      function badge(label, parent, bgC, txC) {
        var f = aF({dir:'HORIZONTAL', hug:true, hugCross:true, fill:sol(bgC||C.acBg), pl:7,pr:7,pt:2,pb:2, r:3}, parent);
        var t = figma.createText();
        t.fontName = FR; t.fontSize = 10; t.characters = label;
        t.fills = sol(txC||C.accent); t.textAutoResize = 'WIDTH_AND_HEIGHT';
        f.appendChild(t);
        return f;
      }

      // Horizontal row: text + badge
      function row(parent) {
        return aF({dir:'HORIZONTAL', hug:true, hugCross:true, gap:8, pt:10,pb:10}, parent);
      }

      // Section card: white box with border
      function section(title, count, parent) {
        var card = aF({dir:'VERTICAL', hug:true, hugCross:true, fill:sol(C.white),
          stroke:C.border, r:14, pt:28,pb:28,pl:32,pr:32, gap:0, la:'STRETCH'}, parent);
        card.name = title;
        // Header row
        var hdr = aF({dir:'HORIZONTAL', hug:true, hugCross:true, gap:8, pb:12, fill:noF()}, card);
        var ht = figma.createText();
        ht.fontName = FB; ht.fontSize = 10; ht.characters = title.toUpperCase();
        ht.fills = sol(C.t3); ht.textAutoResize = 'WIDTH_AND_HEIGHT';
        ht.letterSpacing = {unit:'PERCENT', value:10};
        hdr.appendChild(ht);
        var cp = aF({dir:'HORIZONTAL', hug:true, hugCross:true, fill:sol(C.s2), pl:8,pr:8,pt:1,pb:1,r:99}, hdr);
        var ct = figma.createText();
        ct.fontName = FR; ct.fontSize = 10; ct.characters = String(count) + ' roles';
        ct.fills = sol(C.t3); ct.textAutoResize = 'WIDTH_AND_HEIGHT';
        cp.appendChild(ct);
        // divider
        var div = figma.createRectangle();
        div.resize(400, 1); div.fills = sol(C.border); div.layoutAlign = 'STRETCH';
        card.appendChild(div);
        // content wrapper
        var body = aF({dir:'VERTICAL', hug:true, hugCross:true, gap:0, fill:noF(), la:'STRETCH'}, card);
        return {card:card, body:body};
      }

      // ── Section builders ─────────────────────────────────────────

      function buildPageLevel(parent) {
        var s = section('Page Level', 4, parent);
        var b = s.body;
        var r;
        r = row(b); aT('Tờ trình xin phê duyệt ngân sách Q2/2026',{key:'Display',font:FB,sz:22,lh:130,ls:-2.5},r); badge('Display',r);
        r = row(b); aT('Thông tin chung',{key:'Title',font:FB,sz:18,lh:130,ls:-2},r); badge('Title',r);
        r = row(b); aT('Danh sách đính kèm',{key:'Subtitle',font:FB,sz:16,lh:140},r); badge('Subtitle',r);
        r = row(b); aT('Thông tin người trình',{key:'Overline',sz:10,font:FB,upper:true,ls:8,color:C.t3},r); badge('Overline',r);
      }

      function buildBody(parent) {
        var s = section('Body & Reading', 4, parent);
        var b = s.body;
        var r;
        r = row(b); aT('Tờ trình đề xuất phê duyệt khoản ngân sách bổ sung cho quý 2, nhằm đáp ứng nhu cầu mở rộng hạ tầng CNTT.',{key:'Lead',sz:14,lh:160,color:C.t2},r); badge('Lead',r);
        r = row(b); aT('Căn cứ theo nghị quyết số 12/NQ-HĐQT ngày 01/01/2026, bộ phận CNTT đề xuất bổ sung ngân sách để triển khai hệ thống quản lý quy trình nội bộ.',{key:'Body/Default',sz:13,lh:170,color:C.t2},r); badge('Body/Default',r);
        r = row(b); aT('Tổng kinh phí đề xuất: ₫2,450,000,000 — đã bao gồm chi phí triển khai và đào tạo.',{key:'Body/Strong',font:FB,sz:13,lh:170,color:C.t1},r); badge('Body/Strong',r);
        r = row(b); aT('Tài liệu này chỉ mang tính tham khảo nội bộ.',{key:'Body/Secondary',sz:13,lh:170,color:C.t3},r); badge('Body/Secondary',r);
      }

      function buildForm(parent) {
        var s = section('Form', 8, parent);
        var b = s.body;
        var gap = aF({dir:'VERTICAL',hug:true,hugCross:true,gap:12,fill:noF(),pt:4}, b);

        function formGrid() {
          return aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:16,fill:noF()}, gap);
        }

        function inputField(label, value, isPlaceholder, helperText, helperType, colParent) {
          var col = aF({dir:'VERTICAL',hug:true,hugCross:true,gap:4,fill:noF()}, colParent);
          var lr = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:6,fill:noF()}, col);
          aT(label, {key: helperType==='required'?'Label/Required':'Label/Default', sz:11,font:FB,color:C.t2}, lr);
          if (helperType==='required') { var req=figma.createText(); req.fontName=FR; req.fontSize=11; req.characters='*'; req.fills=sol(C.danger); req.textAutoResize='WIDTH_AND_HEIGHT'; lr.appendChild(req); }
          if (helperType==='disabled') { lr.children[0].fills = sol(C.t4); }
          var inp = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:sol(helperType==='disabled'?C.s2:C.white),stroke:helperType==='error'?C.danger:C.borderMd,r:6,pl:12,pr:12,pt:7,pb:7,clip:true}, col);
          aT(value, {key: isPlaceholder?'Input/Placeholder':'Input/Value', sz:13, color: isPlaceholder?C.t4:C.t1}, inp);
          if (helperText) {
            var hc = helperType==='error'?C.danger : helperType==='success'?C.success : C.t3;
            var hk = helperType==='error'?'Helper/Error' : helperType==='success'?'Helper/Success' : 'Helper/Default';
            aT(helperText, {key:hk, sz:10, color:hc}, col);
          }
          return col;
        }

        var g1 = formGrid();
        inputField('Tên tờ trình','Đề xuất ngân sách Q2/2026',false,'Tên sẽ hiển thị trong danh sách tờ trình','default',g1);
        inputField('Phòng ban *','-- Chọn phòng ban --',true,'','required',g1);

        var g2 = formGrid();
        inputField('Mã tham chiếu','REF-2026-04-0291',false,'','disabled',g2);
        inputField('Email người trình','nguyen.van.an@email',false,'Email không đúng định dạng','error',g2);

        var g3 = formGrid();
        var taCol = aF({dir:'VERTICAL',hug:true,hugCross:true,gap:4,fill:noF()}, g3);
        aT('Nội dung đề xuất', {key:'Label/Default',sz:11,font:FB,color:C.t2}, taCol);
        var ta = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:sol(C.white),stroke:C.borderMd,r:6,pl:12,pr:12,pt:7,pb:7,clip:true}, taCol);
        aT('Đề xuất bổ sung ngân sách ₫2,450,000,000 để triển khai hệ thống quản lý quy trình nội bộ.',{key:'Input/Value',sz:13,color:C.t1},ta);
        aT('Nội dung hợp lệ — đã lưu nháp',{key:'Helper/Success',sz:10,color:C.success},taCol);

        var g4 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:32,fill:noF()}, gap);
        var chkCol = aF({dir:'VERTICAL',hug:true,hugCross:true,gap:6,fill:noF()}, g4);
        function chkRow(label, checked) {
          var cr = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:8,fill:noF()}, chkCol);
          var box = aF({dir:'HORIZONTAL',hug:false,hugCross:false,fill:checked?sol(C.accent):sol(C.white),stroke:C.borderMd,r:3,w:16,h:16}, cr);
          if (checked) { var ck=figma.createText(); ck.fontName=FB; ck.fontSize=10; ck.characters='✓'; ck.fills=sol({r:1,g:1,b:1}); ck.textAutoResize='WIDTH_AND_HEIGHT'; box.appendChild(ck); }
          aT(label, {key:'Input/Value',sz:13,color:C.t1}, cr);
        }
        chkRow('Gửi thông báo qua email', true);
        chkRow('Đính kèm tài liệu hỗ trợ', false);

        var tglCol = aF({dir:'VERTICAL',hug:true,hugCross:true,gap:8,fill:noF()}, g4);
        function tglRow(label, on) {
          var tr2 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:10,align:'CENTER',fill:noF()}, tglCol);
          var track = figma.createFrame();
          track.fills = sol(on ? C.accent : C.borderMd);
          track.cornerRadius = 99; track.resize(36, 20);
          tr2.appendChild(track);
          var knob = figma.createFrame();
          knob.fills = sol({r:1,g:1,b:1}); knob.cornerRadius = 99; knob.resize(14, 14);
          track.appendChild(knob); knob.x = on ? 19 : 3; knob.y = 3;
          aT(label, {key:'Input/Value',sz:13,color:C.t1}, tr2);
        }
        tglRow('Yêu cầu ký số', true);
        tglRow('Cho phép uỷ quyền ký', false);
      }

      function buildTable(parent) {
        var s = section('Table', 6, parent);
        var b = s.body;
        var tbl = aF({dir:'VERTICAL',hug:true,hugCross:false,gap:0,la:'STRETCH',fill:noF(),pt:4}, b);

        // Label legend
        var leg = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:12,fill:noF(),pb:8}, tbl);
        var legItems = [['th:','Table/Header'],['td:','Table/Cell'],['bold:','Table/Cell-Bold'],['sub:','Table/Cell-Sub'],['mono:','Table/Cell-Mono'],['footer:','Table/Footer']];
        for (var li=0; li<legItems.length; li++) {
          var lf = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:4,fill:noF()},leg);
          var lt = figma.createText(); lt.fontName=FR; lt.fontSize=10; lt.characters=legItems[li][0]; lt.fills=sol(C.t3); lt.textAutoResize='WIDTH_AND_HEIGHT'; lf.appendChild(lt);
          badge(legItems[li][1], lf);
        }

        var COLS = [120, 200, 160, 120, 100, 80]; // column widths
        function tblRow(cells, isHead, isFoot) {
          var bg = isHead?C.s2 : isFoot?C.s2 : null;
          var r2 = aF({dir:'HORIZONTAL',hug:false,hugCross:true,fill:bg?sol(bg):noF(),
            stroke:C.border,sw:0,pt:8,pb:8,la:'STRETCH',clip:true}, tbl);
          r2.strokeBottomWeight = 1;
          for (var ci=0; ci<cells.length; ci++) {
            var cell = cells[ci];
            var cw = COLS[ci] || 100;
            var cf = aF({dir:'VERTICAL',hug:false,hugCross:false,fill:noF(),pl:12,pr:4,pt:0,pb:0,w:cw,h:32}, r2);
            if (cell.main) {
              aT(cell.main, {key:cell.mainKey||'Table/Cell', sz:11, font:cell.bold?FB:FR, mono:cell.mono, color:C.t2, upper:cell.upper, ls:cell.ls}, cf);
            }
            if (cell.sub) aT(cell.sub, {key:'Table/Cell-Sub', sz:10, color:C.t3}, cf);
            if (cell.badge2) badge(cell.badge2 === 'warn' ? 'Chờ duyệt' : cell.badge2 === 'success' ? 'Đã duyệt' : 'Từ chối', cf,
              cell.badge2==='warn'?C.warnBg:cell.badge2==='success'?C.sucBg:C.danBg,
              cell.badge2==='warn'?C.warn:cell.badge2==='success'?C.success:C.danger);
          }
          return r2;
        }

        // Header
        tblRow([
          {main:'Mã tờ trình',  mainKey:'Table/Header', upper:true, ls:5, bold:true},
          {main:'Người trình',  mainKey:'Table/Header', upper:true, ls:5, bold:true},
          {main:'Nội dung',     mainKey:'Table/Header', upper:true, ls:5, bold:true},
          {main:'Ngày tạo',     mainKey:'Table/Header', upper:true, ls:5, bold:true},
          {main:'Giá trị',      mainKey:'Table/Header', upper:true, ls:5, bold:true},
          {main:'Trạng thái',   mainKey:'Table/Header', upper:true, ls:5, bold:true},
        ], true, false);
        // Rows
        tblRow([{main:'TT-2026-0291',mainKey:'Table/Cell-Mono',mono:true},{main:'Nguyễn Văn An',mainKey:'Table/Cell-Bold',bold:true,sub:'Phòng CNTT'},{main:'Ngân sách Q2/2026',sub:'Hạ tầng & phần mềm'},{main:'15/04/2026',mainKey:'Table/Cell-Mono',mono:true,sub:'09:42 SA'},{main:'₫2,450,000,000',mainKey:'Table/Cell-Bold',bold:true},{badge2:'warn'}], false, false);
        tblRow([{main:'TT-2026-0290',mainKey:'Table/Cell-Mono',mono:true},{main:'Lê Thị Bích Ngọc',mainKey:'Table/Cell-Bold',bold:true,sub:'Phòng Tài chính'},{main:'Mua sắm thiết bị',sub:'Máy in, màn hình'},{main:'14/04/2026',mainKey:'Table/Cell-Mono',mono:true,sub:'14:20 CH'},{main:'₫185,000,000',mainKey:'Table/Cell-Bold',bold:true},{badge2:'success'}], false, false);
        // Footer
        tblRow([{main:'Tổng 3 tờ trình — hiển thị 1–3 / 48 kết quả',mainKey:'Table/Footer'},{main:''},{main:''},{main:''},{main:'₫2,677,000,000',mainKey:'Table/Footer',bold:true},{main:''}], false, true);
      }

      function buildButton(parent) {
        var s = section('Button', 3, parent);
        var b = s.body;
        var wrap = aF({dir:'VERTICAL',hug:true,hugCross:true,gap:12,fill:noF(),pt:4}, b);

        function btnEl(label, bgC, txC, key, font) {
          var f = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:sol(bgC),stroke:bgC,r:6,pl:20,pr:20,pt:8,pb:8}, null);
          aT(label, {key:key, sz:11, font:font||FB, color:txC}, f);
          return f;
        }

        // Large
        var r1 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:8,fill:noF()}, wrap);
        r1.appendChild(btnEl('Phê duyệt',    C.success, {r:1,g:1,b:1}, 'Button/Large'));
        r1.appendChild(btnEl('Từ chối',      C.danger,  {r:1,g:1,b:1}, 'Button/Large'));
        r1.appendChild(btnEl('Gửi tờ trình', C.accent,  {r:1,g:1,b:1}, 'Button/Large'));
        badge('Button/Large', r1);
        var ht1 = figma.createText(); ht1.fontName=FR; ht1.fontSize=10; ht1.characters='→ font-size: md'; ht1.fills=sol(C.t3); ht1.textAutoResize='WIDTH_AND_HEIGHT'; r1.appendChild(ht1);

        // Default
        var r2 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:8,fill:noF()}, wrap);
        r2.appendChild(btnEl('Lưu nháp',          C.white,  C.t1,             'Button/Default'));
        r2.appendChild(btnEl('Xem trước',         C.white,  C.accent,         'Button/Default'));
        r2.appendChild(btnEl('Huỷ',               C.bg, C.t2,   'Button/Default'));
        r2.appendChild(btnEl('Yêu cầu bổ sung',   C.white,  C.t1,             'Button/Default'));
        badge('Button/Default', r2);

        // Small
        var r3 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:8,fill:noF()}, wrap);
        r3.appendChild(btnEl('Xuất PDF',      C.white, C.t1, 'Button/Small'));
        r3.appendChild(btnEl('In tờ trình',   C.white, C.t1, 'Button/Small'));
        r3.appendChild(btnEl('Chia sẻ',       C.white, C.t1, 'Button/Small'));
        badge('Button/Small', r3);
      }

      function buildBadge(parent) {
        var s = section('Badge & Tag', 3, parent);
        var b = s.body;
        var wrap = aF({dir:'VERTICAL',hug:true,hugCross:true,gap:12,fill:noF(),pt:4}, b);

        function bdg(label, bgC, txC) {
          var f = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:sol(bgC),r:99,pl:10,pr:10,pt:3,pb:3,gap:5}, null);
          aT(label, {key:'Badge/Default',sz:10,font:FB,color:txC}, f);
          return f;
        }
        function bdgDot(label, bgC, txC, dotC) {
          var f = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:sol(bgC),r:99,pl:10,pr:10,pt:3,pb:3,gap:5,align:'CENTER'}, null);
          var dot = aF({hug:false,hugCross:false,fill:sol(dotC),r:99,w:6,h:6}, f);
          aT(label, {key:'Badge/Dot',sz:10,font:FB,color:txC}, f);
          return f;
        }
        function tag(label, active) {
          var f = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:sol(active?C.acBg:C.white),stroke:active?C.accent:C.borderMd,r:4,pl:10,pr:10,pt:3,pb:3}, null);
          aT(label, {key:'Tag',sz:10,font:FB,color:active?C.accent:C.t2}, f);
          return f;
        }

        var r1 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:8,fill:noF()}, wrap);
        r1.appendChild(bdg('Đã duyệt', C.sucBg,  C.success));
        r1.appendChild(bdg('Chờ duyệt',C.warnBg, C.warn));
        r1.appendChild(bdg('Từ chối',  C.danBg,  C.danger));
        r1.appendChild(bdg('Đang xử lý',C.acBg,  C.accent));
        r1.appendChild(bdg('Nháp',     C.s2,     C.t2));
        badge('Badge/Default', r1);

        var r2 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:8,fill:noF()}, wrap);
        r2.appendChild(bdgDot('Đã duyệt', C.sucBg, C.success, C.success));
        r2.appendChild(bdgDot('Chờ duyệt',C.warnBg,C.warn,    C.warn));
        r2.appendChild(bdgDot('Từ chối',  C.danBg, C.danger,  C.danger));
        r2.appendChild(bdgDot('Đang xử lý',C.acBg, C.accent,  C.accent));
        badge('Badge/Dot', r2);

        var r3 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:8,fill:noF()}, wrap);
        r3.appendChild(tag('Tất cả', true));
        r3.appendChild(tag('Chờ tôi duyệt', false));
        r3.appendChild(tag('Tôi đã tạo', false));
        r3.appendChild(tag('Đã hoàn tất', false));
        r3.appendChild(tag('Khẩn cấp', false));
        badge('Tag', r3);
      }

      function buildNav(parent) {
        var s = section('Navigation', 5, parent);
        var b = s.body;
        var grid = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:24,fill:noF(),pt:4}, b);

        // Sidebar mock
        var navCol = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:8}, grid);
        var lbl1 = figma.createText(); lbl1.fontName=FR; lbl1.fontSize=10; lbl1.characters='Sidebar nav'; lbl1.fills=sol(C.t3); lbl1.textAutoResize='WIDTH_AND_HEIGHT'; navCol.appendChild(lbl1);
        var nav = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:sol(C.s2),r:6,pl:16,pr:16,pt:12,pb:12,gap:2}, navCol);

        function navSection(label) {
          var f = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:6,fill:noF(),pt:8,pb:4}, nav);
          aT(label, {key:'Nav/Section',sz:10,font:FB,upper:true,ls:8,color:C.t3}, f);
          badge('Nav/Section', f);
        }
        function navItem(label, active) {
          var f = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:active?sol(C.acBg):noF(),r:4,pl:8,pr:8,pt:5,pb:5,gap:6}, nav);
          aT(label, {key:active?'Nav/Item-Active':'Nav/Item',sz:11,font:active?FB:FR,color:active?C.accent:C.t2}, f);
          if (active) badge('Nav/Item-Active', f);
          else badge('Nav/Item', f);
        }
        navSection('Tờ trình');
        navItem('Danh sách tờ trình', true);
        navItem('Tạo tờ trình mới', false);
        navItem('Chờ tôi phê duyệt', false);
        navSection('Hệ thống');
        navItem('Cài đặt', false);

        // Breadcrumb
        var bcCol = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:8}, grid);
        var lbl2 = figma.createText(); lbl2.fontName=FR; lbl2.fontSize=10; lbl2.characters='Breadcrumb'; lbl2.fills=sol(C.t3); lbl2.textAutoResize='WIDTH_AND_HEIGHT'; bcCol.appendChild(lbl2);
        var bc = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:4,fill:noF()}, bcCol);
        function bcLink(label) { aT(label, {key:'Breadcrumb',sz:11,color:C.accent}, bc); }
        function bcSep()  { var t=figma.createText(); t.fontName=FR; t.fontSize=11; t.characters='/'; t.fills=sol(C.t4); t.textAutoResize='WIDTH_AND_HEIGHT'; bc.appendChild(t); }
        function bcCur(label) { aT(label, {key:'Breadcrumb/Current',sz:11,font:FB,color:C.t1}, bc); }
        bcLink('Trang chủ'); bcSep(); bcLink('Tờ trình'); bcSep(); bcLink('Phê duyệt ngân sách'); bcSep(); bcCur('TT-2026-0291');
        badge('Breadcrumb · Breadcrumb/Current', bcCol);
      }

      function buildNotif(parent) {
        var s = section('Notification & Feedback', 5, parent);
        var b = s.body;
        var grid = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:24,fill:noF(),pt:4}, b);

        // Notification list
        var nCol = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:0}, grid);
        function notifItem(dotC, title, body2, time2) {
          var ni = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:10,fill:noF(),pt:10,pb:10}, nCol);
          var dot = aF({hug:false,hugCross:false,fill:sol(dotC),r:99,w:8,h:8,pt:4}, ni);
          var nd = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:2}, ni);
          aT(title,  {key:'Notif/Title', sz:11,font:FB,color:C.t1}, nd);
          aT(body2,  {key:'Notif/Body',  sz:11,color:C.t2,lh:150},  nd);
          aT(time2,  {key:'Notif/Time',  sz:10,color:C.t4},          nd);
        }
        notifItem(C.accent,  'TT-2026-0291 vừa được phê duyệt',     'Giám đốc Phạm Minh Châu đã ký duyệt tờ trình ngân sách Q2.',  '5 phút trước · 09:42 15/04/2026');
        notifItem(C.warn,    'Tờ trình yêu cầu bổ sung hồ sơ',      'TT-2026-0288 cần đính kèm báo cáo tài chính Q1.',             '2 giờ trước');

        // Toast + Tooltip
        var rCol = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:12}, grid);

        var tlbl = figma.createText(); tlbl.fontName=FR; tlbl.fontSize=10; tlbl.characters='Toast'; tlbl.fills=sol(C.t3); tlbl.textAutoResize='WIDTH_AND_HEIGHT'; rCol.appendChild(tlbl);
        var toast = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:sol(C.dark),r:6,pl:16,pr:16,pt:10,pb:10,gap:10}, rCol);
        aT('Tờ trình đã được gửi thành công', {key:'Toast/Message',sz:11,color:{r:1,g:1,b:1}}, toast);

        var ttlbl = figma.createText(); ttlbl.fontName=FR; ttlbl.fontSize=10; ttlbl.characters='Tooltip'; ttlbl.fills=sol(C.t3); ttlbl.textAutoResize='WIDTH_AND_HEIGHT'; rCol.appendChild(ttlbl);
        var tip = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:sol(C.dark),r:4,pl:10,pr:10,pt:5,pb:5}, rCol);
        aT('Nhấn để xem lịch sử phê duyệt', {key:'Tooltip',sz:10,color:{r:1,g:1,b:1}}, tip);
      }

      function buildApproval(parent) {
        var s = section('Đặc thù tờ trình phê duyệt', 8, parent);
        var b = s.body;
        var grid = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:24,fill:noF(),pt:4}, b);

        // Approval cards
        var acCol = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:10}, grid);
        var ac1lbl = figma.createText(); ac1lbl.fontName=FR; ac1lbl.fontSize=10; ac1lbl.characters='Approval signers'; ac1lbl.fills=sol(C.t3); ac1lbl.textAutoResize='WIDTH_AND_HEIGHT'; acCol.appendChild(ac1lbl);

        function approvalCard(initials, avatarBg, avatarTx, name, role, status, statusC, comment, date) {
          var card2 = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:sol(C.s2),stroke:C.border,r:10,pl:16,pr:16,pt:16,pb:16,gap:0,la:'STRETCH'}, acCol);
          var row2 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:noF(),gap:12}, card2);
          // Avatar
          var av = aF({hug:false,hugCross:false,fill:sol(avatarBg),r:99,w:36,h:36,ja:'CENTER',align:'CENTER'}, row2);
          var avT = figma.createText(); avT.fontName=FB; avT.fontSize=12; avT.characters=initials; avT.fills=sol(avatarTx); avT.textAutoResize='WIDTH_AND_HEIGHT'; avT.layoutAlign='CENTER'; av.appendChild(avT);
          // Info
          var info = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:2}, row2);
          var nr = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:6,fill:noF()},info);
          aT(name,   {key:'Approval/Name',   sz:13,font:FB,color:C.t1}, nr); badge('Approval/Name', nr);
          aT(role,   {key:'Approval/Role',   sz:11,color:C.t3}, info);
          var str = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:6,fill:noF()},info);
          aT(status, {key:'Approval/Status', sz:11,font:FB,color:statusC}, str); badge('Approval/Status', str);
          aT(comment,{key:'Approval/Comment',sz:13,color:C.t2,lh:170}, info);
          var dr = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:6,fill:noF()},info);
          aT(date,   {key:'Approval/Date',   sz:10,font:FM,color:C.t4}, dr); badge('Approval/Date', dr);
          return card2;
        }
        approvalCard('PC', C.acBg, C.accent, 'Phạm Minh Châu','Giám đốc điều hành','✓ Đã phê duyệt',C.success,'Đồng ý với đề xuất. Yêu cầu báo cáo tiến độ hàng tháng.','15/04/2026 · 09:42 SA');
        approvalCard('TL', C.danBg, C.danger, 'Trần Văn Lâm','Trưởng phòng Tài chính','✕ Từ chối',C.danger,'Ngân sách vượt quá hạn mức. Đề nghị điều chỉnh xuống ≤₫2,000,000,000.','14/04/2026 · 16:30 CH');

        // Timeline + Code ref
        var tlCol = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:8}, grid);
        var tllbl = figma.createText(); tllbl.fontName=FR; tllbl.fontSize=10; tllbl.characters='Quy trình xử lý (Timeline)'; tllbl.fills=sol(C.t3); tllbl.textAutoResize='WIDTH_AND_HEIGHT'; tlCol.appendChild(tllbl);
        var tlWrap = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:0}, tlCol);

        function tlItem(stepLabel, descLabel, dotFill, textC) {
          var ti = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:noF(),gap:10,pt:0,pb:16}, tlWrap);
          var dot2 = aF({hug:false,hugCross:false,fill:sol(dotFill),stroke:dotFill,r:99,w:16,h:16}, ti);
          var tc = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:2}, ti);
          var sr = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:6,fill:noF()},tc);
          aT(stepLabel, {key:'Timeline/Step',sz:11,font:FB,color:textC||C.t1}, sr); badge('Timeline/Step', sr);
          var dr2 = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:6,fill:noF()},tc);
          aT(descLabel, {key:'Timeline/Desc',sz:10,color:C.t3}, dr2); badge('Timeline/Desc', dr2);
        }
        tlItem('Tạo tờ trình',        'Nguyễn Văn An · 12/04/2026', C.success, C.t1);
        tlItem('Trưởng phòng xét duyệt','Lê Thị Ngọc · 13/04/2026', C.success, C.t1);
        tlItem('Giám đốc phê duyệt',  'Đang chờ · Hạn 20/04/2026',  C.white,   C.accent);
        tlItem('Hoàn tất & lưu trữ',  'Chưa bắt đầu',               C.white,   C.t3);

        // Code ref
        var crlbl = figma.createText(); crlbl.fontName=FR; crlbl.fontSize=10; crlbl.characters='Code/Reference'; crlbl.fills=sol(C.t3); crlbl.textAutoResize='WIDTH_AND_HEIGHT'; tlCol.appendChild(crlbl);
        var crRow = aF({dir:'HORIZONTAL',hug:true,hugCross:true,gap:8,fill:noF()}, tlCol);
        function codeRef(label) {
          var f = aF({dir:'HORIZONTAL',hug:true,hugCross:true,fill:sol(C.s2),stroke:C.border,r:4,pl:6,pr:6,pt:1,pb:1}, crRow);
          aT(label, {key:'Code/Reference',sz:10,font:FM,color:C.t2}, f);
          return f;
        }
        codeRef('TT-2026-0291'); codeRef('REF-CNTT-Q2-001'); codeRef('NQ-12/2026');
        badge('Code/Reference', crRow);
      }

      // ── Build 3 BP frames ────────────────────────────────────────
      var page = figma.currentPage;
      // Remove old demo frames
      for (var di = page.children.length-1; di >= 0; di--) {
        var dc = page.children[di];
        if (dc.name === 'Demo 1280' || dc.name === 'Demo 1440' || dc.name === 'Demo 1920') dc.remove();
      }

      var BPS = ['1280','1440','1920'];
      var bpFrames = [];
      var startX = 100, startY = 100, gapX = 120;
      var curX = startX;

      for (var bpi = 0; bpi < BPS.length; bpi++) {
        var bp = BPS[bpi];
        var bpW = parseInt(bp);

        var bpF = aF({
          name: 'Demo ' + bp,
          dir: 'VERTICAL', hug: true, hugCross: false,
          fill: sol(C.bg),
          w: bpW, h: 100,
          pt: 48, pb: 64, pl: 40, pr: 40, gap: 16,
        }, null);

        // Page title
        var titleWrap = aF({dir:'VERTICAL',hug:true,hugCross:true,fill:noF(),gap:4}, bpF);
        var titleTag = figma.createText(); titleTag.fontName=FR; titleTag.fontSize=10; titleTag.characters='Design System'; titleTag.fills=sol(C.accent); titleTag.textAutoResize='WIDTH_AND_HEIGHT'; titleTag.letterSpacing={unit:'PERCENT',value:10}; titleWrap.appendChild(titleTag);
        var titleH = figma.createText(); titleH.fontName=FB; titleH.fontSize=28; titleH.characters='Typography Roles'; titleH.fills=sol(C.t1); titleH.textAutoResize='WIDTH_AND_HEIGHT'; titleWrap.appendChild(titleH);
        var titleS = figma.createText(); titleS.fontName=FR; titleS.fontSize=14; titleS.characters='46 roles · 7 token sizes · Breakpoint ' + bp + 'px'; titleS.fills=sol(C.t3); titleS.textAutoResize='WIDTH_AND_HEIGHT'; titleWrap.appendChild(titleS);

        buildPageLevel(bpF);
        buildBody(bpF);
        buildForm(bpF);
        buildTable(bpF);
        buildButton(bpF);
        buildBadge(bpF);
        buildNav(bpF);
        buildNotif(bpF);
        buildApproval(bpF);

        page.appendChild(bpF);
        bpF.x = curX; bpF.y = startY;
        curX += bpW + gapX;

        if (vsR && vsR.col && vsR.modeMap && vsR.modeMap[bp]) {
          try { bpF.setExplicitVariableModeForCollection(vsR.col, vsR.modeMap[bp]); } catch(e) {}
        }

        bpFrames.push(bpF);
      }

      figma.viewport.scrollAndZoomIntoView(bpFrames);
      figma.ui.postMessage({ type: 'demoCreated', text: '3 frames (1280 / 1440 / 1920) · ' + Object.keys(styleMap).length + ' text styles bound' });
    } catch(e2) {
      figma.ui.postMessage({ type: 'demoError', text: 'Lỗi: ' + e2.message });
    }
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

  // ── Duplicate (áp dụng cho tất cả frame được chọn) ───────────────────────
  if (msg.duplicate && msg.breakpoints.length > 0) {
    var allCloned = [];
    for (var di = 0; di < frameIds.length; di++) {
      var srcFrame = figma.getNodeById(frameIds[di]);
      if (srcFrame && srcFrame.type === 'FRAME') {
        var cloned = duplicateFrames(srcFrame, res.col, res.modeMap, msg.breakpoints);
        allCloned = allCloned.concat(cloned);
      }
    }
    if (allCloned.length > 0) lines.push('✓ Frames: ' + allCloned.join(', '));
  }

  // ── Guideline ─────────────────────────────────────────────────────────────
  if (msg.guideline) {
    await createGuideline(msg.sampleText || 'Ag');
    lines.push('✓ Guidelines đã tạo');
  }

  figma.ui.postMessage({ type: 'done', text: lines.join('\n') });
};
