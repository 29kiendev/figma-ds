import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env manually (no external deps)
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
);

const TOKEN = env.FIGMA_TOKEN;
const FILE_KEY = env.FIGMA_FILE_KEY;

if (!TOKEN || TOKEN === 'paste_your_token_here') {
  console.error('ERROR: Hãy điền FIGMA_TOKEN vào file .env');
  process.exit(1);
}

async function figmaGet(path) {
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { 'X-Figma-Token': TOKEN },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API ${res.status}: ${text}`);
  }
  return res.json();
}

// Walk all nodes recursively, collect by type
function walkNodes(node, collector) {
  collector(node);
  if (node.children) {
    for (const child of node.children) walkNodes(child, collector);
  }
}

async function main() {
  console.log(`\nĐang đọc file: ${FILE_KEY} ...\n`);

  // 1. Thông tin file
  const meta = await figmaGet(`/files/${FILE_KEY}?depth=1`);
  console.log(`File name : ${meta.name}`);
  console.log(`Last modified: ${meta.lastModified}`);
  console.log(`Pages (${meta.document.children.length}): ${meta.document.children.map(p => p.name).join(', ')}`);

  // 2. Text styles từ file styles
  console.log('\n--- TEXT STYLES ---');
  const stylesData = await figmaGet(`/files/${FILE_KEY}/styles`);
  const textStyles = stylesData.meta.styles.filter(s => s.style_type === 'TEXT');
  if (textStyles.length === 0) {
    console.log('(Không có text style nào được định nghĩa)');
  } else {
    for (const s of textStyles) {
      console.log(`  [${s.key}] ${s.name}`);
    }
  }

  // 3. Đọc toàn bộ document để phân tích text nodes
  console.log('\nĐang tải toàn bộ document (có thể mất vài giây)...');
  const full = await figmaGet(`/files/${FILE_KEY}`);

  const textNodes = [];
  walkNodes(full.document, node => {
    if (node.type === 'TEXT') textNodes.push(node);
  });

  console.log(`\nTổng số TEXT nodes: ${textNodes.length}`);

  // 4. Thống kê font sizes
  const sizeMap = new Map(); // fontSize -> count
  const fontMap = new Map(); // fontFamily -> Set of sizes

  for (const n of textNodes) {
    const style = n.style;
    if (!style) continue;
    const size = style.fontSize;
    const family = style.fontFamily;
    if (size) sizeMap.set(size, (sizeMap.get(size) ?? 0) + 1);
    if (family) {
      if (!fontMap.has(family)) fontMap.set(family, new Set());
      fontMap.get(family).add(size);
    }
  }

  console.log('\n--- FONT SIZES ĐANG DÙNG ---');
  const sortedSizes = [...sizeMap.entries()].sort((a, b) => a[0] - b[0]);
  for (const [size, count] of sortedSizes) {
    console.log(`  ${String(size).padStart(4)}px  →  ${count} nodes`);
  }

  console.log('\n--- FONT FAMILIES ĐANG DÙNG ---');
  for (const [family, sizes] of [...fontMap.entries()].sort()) {
    const sortedSz = [...sizes].sort((a, b) => a - b).join(', ');
    console.log(`  ${family}: [${sortedSz}]`);
  }

  // 5. Liệt kê top-level nodes trên mọi trang
  console.log('\n--- TOP-LEVEL NODES THEO TRANG ---');
  for (const page of full.document.children) {
    const children = page.children ?? [];
    console.log(`  Page "${page.name}" (${children.length} nodes):`);
    for (const n of children) {
      const w = n.absoluteBoundingBox?.width ?? '?';
      const h = n.absoluteBoundingBox?.height ?? '?';
      console.log(`    [${n.type}] [${n.id}] "${n.name}"  ${w}×${h}`);
    }
  }

  console.log('\nHoàn tất.\n');
}

main().catch(err => {
  console.error('\nLỗi:', err.message);
  process.exit(1);
});
