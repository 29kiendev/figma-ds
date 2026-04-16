/**
 * apply-styles.js
 *
 * Bước 1: Đọc toàn bộ TEXT nodes trong Figma file
 * Bước 2: Match theo rules (font-size + font-weight + properties)
 * Bước 3: Báo cáo kết quả
 *
 * NOTE: Figma REST API không hỗ trợ PATCH node properties.
 *       Việc gán textStyleId thực hiện qua plugin action "Gán Text Styles tự động".
 *
 * Chạy: node apply-styles.js
 */

import { figmaGet } from './lib/figma-api.js';
import { FILE_KEY } from './lib/config.js';

const GROUP_NAME = 'FAN Font';

// Thứ tự quan trọng — specific conditions trước, generic sau
const RULES = [
  { fontSize: 22, fontWeight: 600,                         style: 'Display'        },
  { fontSize: 18, fontWeight: 600,                         style: 'Title'          },
  { fontSize: 16, fontWeight: 500,                         style: 'Subtitle'       },
  { fontSize: 14, fontWeight: 400, minLHPct: 150,          style: 'Lead'           },
  { fontSize: 13, fontWeight: 600,                         style: 'Body/Strong'    },
  { fontSize: 13, fontWeight: 400,                         style: 'Body/Default'   },
  { fontSize: 11, fontWeight: 600, letterSpacingGt0: true, style: 'Overline'       },
  { fontSize: 11, fontWeight: 500,                         style: 'Label/Default'  },
  { fontSize: 11, fontWeight: 400,                         style: 'Helper/Default' },
];

// Body/Secondary không match được qua typography (chỉ khác màu)
const UNMATCHABLE = ['Body/Secondary', 'Input/Placeholder', 'Label/Disabled'];

function getLineHeightPct(s) {
  if (s.lineHeightUnit === 'INTRINSIC_%' || s.lineHeightUnit === 'PERCENT') {
    return s.lineHeightPercent ?? null;
  }
  if (s.lineHeightUnit === 'PIXELS' && s.lineHeightPx && s.fontSize) {
    return Math.round((s.lineHeightPx / s.fontSize) * 100);
  }
  return null;
}

function matchRule(s) {
  const lhPct = getLineHeightPct(s);
  const ls    = typeof s.letterSpacing === 'number' ? s.letterSpacing : 0;

  for (const r of RULES) {
    if (r.fontSize   !== s.fontSize)   continue;
    if (r.fontWeight !== s.fontWeight) continue;
    if (r.minLHPct       && (!lhPct || lhPct < r.minLHPct)) continue;
    if (r.letterSpacingGt0 && Math.abs(ls) < 0.001)         continue;
    return r.style;
  }
  return null;
}

function walk(node, acc) {
  if (node.type === 'TEXT') acc.push(node);
  if (node.children) for (const c of node.children) walk(c, acc);
}

function trunc(str, n) {
  if (!str) return '(trống)';
  const s = str.replace(/[\n\t\r]/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function pad(str, n) { return String(str).padEnd(n); }
function rpad(str, n) { return String(str).padStart(n); }

async function main() {
  console.log(`\nĐang đọc file ${FILE_KEY}...`);

  const [file, stylesData] = await Promise.all([
    figmaGet(`/files/${FILE_KEY}`),
    figmaGet(`/files/${FILE_KEY}/styles`),
  ]);

  console.log(`File: "${file.name}"\n`);

  // Index existing text styles by name
  const existingStyles = new Set(
    stylesData.meta.styles
      .filter(s => s.style_type === 'TEXT')
      .map(s => s.name)
  );
  console.log(`Text styles hiện có trong file: ${existingStyles.size}`);

  // Collect all TEXT nodes across all pages
  const nodes = [];
  for (const page of file.document.children) walk(page, nodes);
  console.log(`Tổng TEXT nodes: ${nodes.length}\n`);

  // Match rules
  const matched  = [];
  const skipped  = [];
  const skipTally = {};

  for (const node of nodes) {
    const s = node.style ?? {};
    const ruleName = matchRule(s);

    if (ruleName) {
      const fullName = `${GROUP_NAME}/${ruleName}`;
      matched.push({
        id:         node.id,
        text:       node.characters ?? '',
        fontSize:   s.fontSize,
        fontWeight: s.fontWeight,
        lhPct:      getLineHeightPct(s),
        styleName:  fullName,
        exists:     existingStyles.has(fullName),
      });
    } else {
      const key = `size ${s.fontSize ?? '?'}  weight ${s.fontWeight ?? '?'}`;
      skipTally[key] = (skipTally[key] ?? 0) + 1;
      skipped.push(node);
    }
  }

  // ── Matched table ───────────────────────────────────────────────────────────
  const SEP = '─'.repeat(92);
  console.log('━'.repeat(92));
  console.log(
    pad('NODE ID', 20) + '  ' +
    pad('TEXT', 22) + '  ' +
    rpad('SZ', 4) + '  ' +
    rpad('WT', 5) + '  ' +
    rpad('LH%', 5) + '  ' +
    'STYLE'
  );
  console.log(SEP);

  for (const m of matched) {
    const warn = m.exists ? '' : '  ⚠ chưa tạo';
    console.log(
      pad(m.id, 20)                            + '  ' +
      pad(trunc(m.text, 20), 22)               + '  ' +
      rpad(m.fontSize  ?? '?', 4)              + '  ' +
      rpad(m.fontWeight ?? '?', 5)             + '  ' +
      rpad(m.lhPct ? Math.round(m.lhPct) : '-', 5) + '  ' +
      m.styleName + warn
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n' + '━'.repeat(92));
  console.log(`Tổng      : ${nodes.length} nodes`);
  console.log(`✓ Matched : ${matched.length} nodes`);
  console.log(`✗ Skipped : ${skipped.length} nodes`);

  if (Object.keys(skipTally).length) {
    console.log('\nSkipped — không match rule nào:');
    for (const [key, count] of Object.entries(skipTally).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${rpad(count, 4)}×  ${key}`);
    }
  }

  const notFound = matched.filter(m => !m.exists);
  if (notFound.length) {
    const unique = [...new Set(notFound.map(m => m.styleName))];
    console.log(`\n⚠  ${notFound.length} nodes trỏ đến styles chưa có trong file:`);
    for (const n of unique) console.log(`   • ${n}`);
    console.log(`   → Chạy plugin → tick "Tạo Text Styles" trước.\n`);
  }

  console.log(`\n⚠  Không map được (cần phân biệt bằng màu): ${UNMATCHABLE.join(', ')}`);
  console.log(`\n💡 Để gán styles thực sự: mở plugin → tick "Gán Text Styles tự động" → Chạy\n`);
}

main().catch(err => {
  console.error('\nLỗi:', err.message);
  process.exit(1);
});
