// Tạo frame Typography Guideline trong Figma

var TOKENS = [
  { name: '2xs',  sizes: [10,10,11], lh: [16,16,16], ls: [0,0,0]          },
  { name: 'xs',   sizes: [11,11,12], lh: [16,16,18], ls: [0,0,0]          },
  { name: 'sm',   sizes: [11,12,13], lh: [16,18,20], ls: [0,0,0]          },
  { name: 'base', sizes: [13,14,16], lh: [20,22,24], ls: [0,0,0]          },
  { name: 'md',   sizes: [14,15,17], lh: [20,22,26], ls: [0,0,0]          },
  { name: 'lg',   sizes: [16,16,18], lh: [24,24,28], ls: [0,0,0]          },
  { name: 'xl',   sizes: [18,20,22], lh: [28,30,34], ls: [-0.2,-0.3,-0.4] },
  { name: '2xl',  sizes: [22,24,28], lh: [32,36,42], ls: [-0.4,-0.5,-0.6] },
];
var BREAKPOINTS = ['1280', '1440', '1920'];

var COL_TOKEN = 120;
var COL_BP    = 280;
var ROW_H     = 90;
var PAD       = 48;
var GAP       = 1;

var C_BG      = { r: 0.97, g: 0.97, b: 0.98 };
var C_WHITE   = { r: 1,    g: 1,    b: 1    };
var C_HEADER  = { r: 0.06, g: 0.06, b: 0.08 };
var C_LABEL   = { r: 0.45, g: 0.45, b: 0.50 };
var C_SAMPLE  = { r: 0.08, g: 0.08, b: 0.10 };
var C_BORDER  = { r: 0.88, g: 0.88, b: 0.90 };
var C_ACCENT  = { r: 0.24, g: 0.52, b: 1.00 };
var C_TAG_BG  = { r: 0.93, g: 0.96, b: 1.00 };

var FONT_REG  = { family: 'Arial', style: 'Regular' };
var FONT_BOLD = { family: 'Arial', style: 'Bold' };

function rgb(c, a) {
  return [{ type: 'SOLID', color: c, opacity: a !== undefined ? a : 1 }];
}

async function loadFonts() {
  await figma.loadFontAsync(FONT_REG);
  await figma.loadFontAsync(FONT_BOLD);
}

function makeText(str, size, font, color, parent) {
  var t = figma.createText();
  parent.appendChild(t);
  t.fontName = font;
  t.fontSize = size;
  t.characters = str;
  t.fills = rgb(color);
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}

function makeRect(w, h, color, parent) {
  var r = figma.createRectangle();
  parent.appendChild(r);
  r.resize(w, h);
  r.fills = rgb(color);
  return r;
}

function makeFrame(w, h, color, parent) {
  var f = figma.createFrame();
  if (parent) parent.appendChild(f);
  f.resize(w, h);
  f.fills = color ? rgb(color) : [];
  f.clipsContent = true;
  return f;
}

async function main() {
  await loadFonts();

  var totalW = PAD * 2 + COL_TOKEN + BREAKPOINTS.length * COL_BP + (BREAKPOINTS.length) * GAP;
  var totalH = PAD * 2 + 80 + 16 + 50 + GAP + TOKENS.length * (ROW_H + GAP);

  var root = makeFrame(totalW, totalH, C_BG, null);
  root.name = 'Typography Guidelines';
  root.x = 200;
  root.y = 200;

  // ── Header ──
  var titleY = PAD;
  var title = makeText('Typography Guidelines', 28, FONT_BOLD, C_HEADER, root);
  title.x = PAD;
  title.y = titleY;

  var sub = makeText('Font: Arial  ·  Tokens: 8  ·  Breakpoints: 1280 / 1440 / 1920', 13, FONT_REG, C_LABEL, root);
  sub.x = PAD;
  sub.y = titleY + 38;

  // ── Column headers ──
  var headerY = PAD + 80 + 16;
  var headerBg = makeRect(totalW, 50, C_WHITE, root);
  headerBg.x = 0; headerBg.y = headerY;

  var colHeaderNames = ['Token', '1280', '1440', '1920'];
  var colX = PAD;
  for (var hi = 0; hi < colHeaderNames.length; hi++) {
    var hLabel = makeText(colHeaderNames[hi], 11, FONT_BOLD, C_LABEL, root);
    hLabel.x = colX;
    hLabel.y = headerY + 18;
    colX += hi === 0 ? COL_TOKEN : COL_BP;
  }

  // border bottom of header
  var hBorder = makeRect(totalW, GAP, C_BORDER, root);
  hBorder.x = 0; hBorder.y = headerY + 50;

  // ── Rows ──
  for (var ri = 0; ri < TOKENS.length; ri++) {
    var tok = TOKENS[ri];
    var rowY = PAD + 80 + 16 + 50 + GAP + ri * (ROW_H + GAP);

    // row background
    var rowBg = makeRect(totalW, ROW_H, C_WHITE, root);
    rowBg.x = 0; rowBg.y = rowY;

    // token name tag
    var tagW = 52, tagH = 24, tagX = PAD, tagY = rowY + (ROW_H - tagH) / 2;
    var tag = makeFrame(tagW, tagH, C_TAG_BG, root);
    tag.x = tagX; tag.y = tagY;
    tag.cornerRadius = 6;
    var tagLabel = makeText(tok.name, 11, FONT_BOLD, C_ACCENT, tag);
    tagLabel.x = (tagW - tagLabel.width) / 2;
    tagLabel.y = (tagH - tagLabel.height) / 2;

    // breakpoint cells
    for (var bi = 0; bi < BREAKPOINTS.length; bi++) {
      var cellX = PAD + COL_TOKEN + bi * COL_BP + bi * GAP;
      var sz = tok.sizes[bi];
      var lh = tok.lh[bi];
      var ls = tok.ls[bi];

      // sample text
      var sample = makeText('Ag', sz, FONT_BOLD, C_SAMPLE, root);
      sample.x = cellX;
      sample.y = rowY + (ROW_H - sz * 1.2) / 2 - 4;

      // spec label: "14px / lh 22 / ls 0"
      var lsStr = ls === 0 ? '0' : ls.toString();
      var spec = makeText(sz + 'px  ·  lh ' + lh + '  ·  ls ' + lsStr, 10, FONT_REG, C_LABEL, root);
      spec.x = cellX;
      spec.y = rowY + ROW_H - 22;
    }

    // border bottom
    var rowBorder = makeRect(totalW, GAP, C_BORDER, root);
    rowBorder.x = 0; rowBorder.y = rowY + ROW_H;
  }

  // vertical dividers
  var divX = PAD + COL_TOKEN;
  for (var di = 0; di < BREAKPOINTS.length; di++) {
    var div = makeRect(GAP, totalH - PAD, C_BORDER, root);
    div.x = divX; div.y = PAD + 80 + 16;
    divX += COL_BP + GAP;
  }

  figma.currentPage.appendChild(root);
  figma.viewport.scrollAndZoomIntoView([root]);
  figma.closePlugin('Guideline da duoc tao!');
}

main();
