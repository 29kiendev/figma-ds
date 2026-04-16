// Typography DS Plugin — with UI

var COLLECTION_NAME = 'Typography';
var TARGET_FONT     = 'Arial';
var MODES           = ['1280', '1440', '1920'];
var SKIP_SIZES      = [8, 9];
var FONT_MONO       = 'Courier New';
var WEIGHT_MAP      = { 400: 'Regular', 500: 'Bold', 600: 'Bold' };

var SIZE_TOKENS = {
  'size/2xs':  { '1280': 10, '1440': 10, '1920': 11 },
  'size/xs':   { '1280': 11, '1440': 11, '1920': 12 },
  'size/sm':   { '1280': 11, '1440': 12, '1920': 13 },
  'size/base': { '1280': 13, '1440': 14, '1920': 16 },
  'size/md':   { '1280': 14, '1440': 15, '1920': 17 },
  'size/lg':   { '1280': 16, '1440': 16, '1920': 18 },
  'size/xl':   { '1280': 18, '1440': 20, '1920': 22 },
  'size/2xl':  { '1280': 22, '1440': 24, '1920': 28 },
};
var LH_TOKENS = {
  'line-height/2xs':  { '1280': 16, '1440': 16, '1920': 16 },
  'line-height/xs':   { '1280': 16, '1440': 16, '1920': 18 },
  'line-height/sm':   { '1280': 16, '1440': 18, '1920': 20 },
  'line-height/base': { '1280': 20, '1440': 22, '1920': 24 },
  'line-height/md':   { '1280': 20, '1440': 22, '1920': 26 },
  'line-height/lg':   { '1280': 24, '1440': 24, '1920': 28 },
  'line-height/xl':   { '1280': 28, '1440': 30, '1920': 34 },
  'line-height/2xl':  { '1280': 32, '1440': 36, '1920': 42 },
};
var LS_TOKENS = {
  'letter-spacing/0':       { '1280':    0, '1440':    0, '1920':    0 },
  'letter-spacing/tight':   { '1280': -0.2, '1440': -0.3, '1920': -0.4 },
  'letter-spacing/tighter': { '1280': -0.4, '1440': -0.5, '1920': -0.6 },
};
var SIZE_TO_SUFFIX = {
  10: '2xs', 11: 'xs',  12: 'sm',  13: 'base',
  14: 'md',  15: 'md',  16: 'lg',  17: 'lg',
  18: 'xl',  20: 'xl',  22: '2xl', 24: '2xl', 28: '2xl',
};
var SUFFIX_TO_LS = {
  '2xs': 'letter-spacing/0', 'xs': 'letter-spacing/0',
  'sm':  'letter-spacing/0', 'base': 'letter-spacing/0',
  'md':  'letter-spacing/0', 'lg': 'letter-spacing/0',
  'xl':  'letter-spacing/tight', '2xl': 'letter-spacing/tighter',
};
var GUIDELINE_TOKENS = [
  { name: '2xs',  sizes: [10,10,11], lh: [16,16,16], ls: [0,0,0]           },
  { name: 'xs',   sizes: [11,11,12], lh: [16,16,18], ls: [0,0,0]           },
  { name: 'sm',   sizes: [11,12,13], lh: [16,18,20], ls: [0,0,0]           },
  { name: 'base', sizes: [13,14,16], lh: [20,22,24], ls: [0,0,0]           },
  { name: 'md',   sizes: [14,15,17], lh: [20,22,26], ls: [0,0,0]           },
  { name: 'lg',   sizes: [16,16,18], lh: [24,24,28], ls: [0,0,0]           },
  { name: 'xl',   sizes: [18,20,22], lh: [28,30,34], ls: [-0.2,-0.3,-0.4]  },
  { name: '2xl',  sizes: [22,24,28], lh: [32,36,42], ls: [-0.4,-0.5,-0.6]  },
];

var STYLE_TO_WEIGHT = {
  'Thin': 100, 'ExtraLight': 200, 'Light': 300,
  'Regular': 400, 'Medium': 500,
  'SemiBold': 600, 'DemiBold': 600,
  'Bold': 700, 'ExtraBold': 800, 'Black': 900,
};

// Rules cho auto-apply: dùng fontName.style thay vì weight số
// vì Plugin API trả về style string, không phải weight number
var APPLY_RULES = [
  { fontSize: 22, fontStyle: 'Bold',                      style: 'Display'        },
  { fontSize: 18, fontStyle: 'Bold',                      style: 'Title'          },
  { fontSize: 16, fontStyle: 'Bold',                      style: 'Subtitle'       },
  { fontSize: 14, fontStyle: 'Regular', minLHPct: 150,    style: 'Lead'           },
  { fontSize: 13, fontStyle: 'Bold',                      style: 'Body/Strong'    },
  { fontSize: 13, fontStyle: 'Regular',                   style: 'Body/Default'   },
  { fontSize: 11, fontStyle: 'Bold',    minLS: true,       style: 'Overline'       },
  { fontSize: 11, fontStyle: 'Bold',                      style: 'Label/Default'  },
  { fontSize: 11, fontStyle: 'Regular',                   style: 'Helper/Default' },
];

var STYLE_DEFS = [
  // PAGE LEVEL
  { name: 'Display',            token: '2xl',  weight: 600, lh: 130 },
  { name: 'Title',              token: 'xl',   weight: 600, lh: 130 },
  { name: 'Subtitle',           token: 'lg',   weight: 500, lh: 140 },
  { name: 'Overline',           token: 'xs',   weight: 600, textCase: 'UPPER', ls: 8 },
  // BODY
  { name: 'Body/Default',       token: 'base', weight: 400, lh: 170 },
  { name: 'Body/Strong',        token: 'base', weight: 600, lh: 170 },
  { name: 'Body/Secondary',     token: 'base', weight: 400, lh: 170 },
  { name: 'Lead',               token: 'md',   weight: 400, lh: 160 },
  // FORM
  { name: 'Label/Default',      token: 'sm',   weight: 500 },
  { name: 'Label/Required',     token: 'sm',   weight: 500 },
  { name: 'Label/Disabled',     token: 'sm',   weight: 500 },
  { name: 'Input/Value',        token: 'base', weight: 400 },
  { name: 'Input/Placeholder',  token: 'base', weight: 400 },
  { name: 'Helper/Default',     token: 'xs',   weight: 400 },
  { name: 'Helper/Error',       token: 'xs',   weight: 400 },
  { name: 'Helper/Success',     token: 'xs',   weight: 400 },
  // TABLE
  { name: 'Table/Header',       token: 'xs',   weight: 600, textCase: 'UPPER', ls: 5 },
  { name: 'Table/Cell',         token: 'sm',   weight: 400 },
  { name: 'Table/Cell-Bold',    token: 'sm',   weight: 600 },
  { name: 'Table/Cell-Sub',     token: 'xs',   weight: 400 },
  { name: 'Table/Cell-Mono',    token: 'xs',   weight: 400, mono: true },
  { name: 'Table/Footer',       token: 'xs',   weight: 500 },
  // BUTTON
  { name: 'Button/Large',       token: 'md',   weight: 500, lh: 100 },
  { name: 'Button/Default',     token: 'sm',   weight: 500, lh: 100 },
  { name: 'Button/Small',       token: 'xs',   weight: 500, lh: 100 },
  // BADGE & TAG
  { name: 'Badge/Default',      token: 'xs',   weight: 500 },
  { name: 'Badge/Dot',          token: 'xs',   weight: 500 },
  { name: 'Tag',                token: 'xs',   weight: 500 },
  // NAVIGATION
  { name: 'Nav/Item',           token: 'sm',   weight: 400 },
  { name: 'Nav/Item-Active',    token: 'sm',   weight: 600 },
  { name: 'Nav/Section',        token: 'xs',   weight: 600, textCase: 'UPPER', ls: 8 },
  { name: 'Breadcrumb',         token: 'sm',   weight: 400 },
  { name: 'Breadcrumb/Current', token: 'sm',   weight: 500 },
  // NOTIFICATION
  { name: 'Notif/Title',        token: 'sm',   weight: 500 },
  { name: 'Notif/Body',         token: 'sm',   weight: 400 },
  { name: 'Notif/Time',         token: 'xs',   weight: 400 },
  { name: 'Toast/Message',      token: 'sm',   weight: 400 },
  { name: 'Tooltip',            token: 'xs',   weight: 400 },
  // APPROVAL & TIMELINE
  { name: 'Approval/Name',      token: 'base', weight: 600 },
  { name: 'Approval/Role',      token: 'sm',   weight: 400 },
  { name: 'Approval/Status',    token: 'sm',   weight: 500 },
  { name: 'Approval/Comment',   token: 'base', weight: 400, lh: 170 },
  { name: 'Approval/Date',      token: 'xs',   weight: 400, mono: true },
  { name: 'Timeline/Step',      token: 'sm',   weight: 500 },
  { name: 'Timeline/Desc',      token: 'xs',   weight: 400 },
  { name: 'Code/Reference',     token: 'xs',   weight: 500, mono: true },
];

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

// ─── Bind variables ───────────────────────────────────────────────────────────

async function bindVariables(frame, varMap) {
  var stats = { size:0, lh:0, ls:0, family:0, style:0, skip:0, err:0 };
  var nodes = [];
  function walk(n) {
    if (n.type === 'TEXT') nodes.push(n);
    if (n.children) for (var i = 0; i < n.children.length; i++) walk(n.children[i]);
  }
  walk(frame);

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var mixed = node.fontName === figma.mixed;
    var fam = mixed
      ? (function(){ try { return node.getRangeFontName(0,1).family; } catch(e){ return null; } })()
      : node.fontName.family;
    if (fam !== TARGET_FONT) { stats.skip++; continue; }

    var sty = mixed
      ? (function(){ try { return node.getRangeFontName(0,1).style; } catch(e){ return null; } })()
      : node.fontName.style;
    var size = node.fontSize === figma.mixed
      ? (function(){ try { return node.getRangeFontSize(0,1); } catch(e){ return null; } })()
      : node.fontSize;
    if (size === null || inSkip(size)) { stats.skip++; continue; }

    try {
      if (mixed) { await figma.loadFontAsync({ family: fam, style: sty || 'Regular' }); }
      else { await figma.loadFontAsync(node.fontName); }
    } catch(e) { stats.err++; continue; }

    var sfx = SIZE_TO_SUFFIX[size];
    var lsKey = sfx ? SUFFIX_TO_LS[sfx] : null;

    if (sfx && varMap['size/' + sfx]) {
      try { node.setBoundVariable('fontSize', varMap['size/' + sfx]); stats.size++; } catch(e) { stats.err++; }
    }
    if (sfx && varMap['line-height/' + sfx]) {
      try {
        node.lineHeight = { value: LH_TOKENS['line-height/' + sfx]['1280'], unit: 'PIXELS' };
        node.setBoundVariable('lineHeight', varMap['line-height/' + sfx]);
        stats.lh++;
      } catch(e) { stats.err++; }
    }
    if (lsKey && varMap[lsKey]) {
      try {
        node.letterSpacing = { value: LS_TOKENS[lsKey]['1280'], unit: 'PIXELS' };
        node.setBoundVariable('letterSpacing', varMap[lsKey]);
        stats.ls++;
      } catch(e) { stats.err++; }
    }
    if (sty) {
      var stk = 'font-style/' + sty.toLowerCase().replace(/\s+/g, '-');
      if (varMap[stk]) {
        try { node.setBoundVariable('fontStyle', varMap[stk]); stats.style++; } catch(e) { stats.err++; }
      }
    }
  }
  return stats;
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
  for (var si = 0; si < STYLE_DEFS.length; si++) {
    var def = STYLE_DEFS[si];
    var styleName = groupName + '/' + def.name;
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

figma.showUI(__html__, { width: 320, height: 500 });

// Gửi danh sách frames lên UI
var frameList = [];
for (var pi = 0; pi < figma.root.children.length; pi++) {
  var pg = figma.root.children[pi];
  var pgch = pg.children || [];
  for (var ci = 0; ci < pgch.length; ci++) {
    var n = pgch[ci];
    if (n.type === 'FRAME') {
      frameList.push({ id: n.id, name: n.name, page: pg.name,
        w: Math.round(n.width), h: Math.round(n.height) });
    }
  }
}
figma.ui.postMessage({ type: 'frames', data: frameList });

figma.ui.onmessage = async function(msg) {
  if (msg.type !== 'run') return;

  var frame = figma.getNodeById(msg.frameId);
  if (!frame || frame.type !== 'FRAME') {
    figma.ui.postMessage({ type: 'error', text: 'Không tìm thấy frame.' }); return;
  }

  var groupName = msg.groupName || 'FAN Font';
  var lines = [];

  // ── Chuẩn hoá: variables → text styles → gán styles ──────────────────────
  var res;
  try { res = setupVariables(collectFontStyles(frame)); }
  catch(e) { figma.ui.postMessage({ type: 'error', text: 'Lỗi variables: ' + e.message }); return; }
  frame.setExplicitVariableModeForCollection(res.col, res.modeMap['1280']);

  var styleCount = await createTextStyles(groupName, res.varMap);
  lines.push('✓ ' + styleCount + ' text styles');

  var ar = autoApplyStyles(frame, groupName);
  var applyLine = '✓ Gán: ' + ar.applied + ' nodes';
  if (ar.skipped > 0) {
    var topReasons = Object.entries(ar.skipReasons)
      .sort(function(a,b){ return b[1]-a[1]; }).slice(0,3)
      .map(function(e){ return e[1]+'× '+e[0]; });
    applyLine += '  ✗ bỏ qua: ' + ar.skipped + ' (' + topReasons.join(', ') + ')';
  }
  lines.push(applyLine);

  // ── Duplicate (tuỳ chọn) ─────────────────────────────────────────────────
  if (msg.duplicate && msg.breakpoints.length > 0) {
    var cloned = duplicateFrames(frame, res.col, res.modeMap, msg.breakpoints);
    if (cloned.length > 0) lines.push('✓ Frames: ' + cloned.join(', '));
  }

  // ── Guideline (tuỳ chọn) ─────────────────────────────────────────────────
  if (msg.guideline) {
    await createGuideline(msg.sampleText || 'Ag');
    lines.push('✓ Guidelines đã tạo');
  }

  figma.ui.postMessage({ type: 'done', text: lines.join('\n') });
};
