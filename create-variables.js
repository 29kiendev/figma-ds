/**
 * Script 2: Tạo Local Variables collection "Font Size" với 3 modes (1280/1440/1920)
 * Sử dụng Figma Variables REST API
 * Chạy: node create-variables.js
 */

import { figmaGet, figmaPost } from './lib/figma-api.js';
import { FILE_KEY, TOKENS, COLLECTION_NAME, MODES } from './lib/config.js';

async function main() {
  // Kiểm tra xem collection đã tồn tại chưa
  console.log('Kiểm tra variables hiện có...');
  const existing = await figmaGet(`/files/${FILE_KEY}/variables/local`);

  const existingCollections = Object.values(existing.meta?.variableCollections ?? {});
  const alreadyExists = existingCollections.find(c => c.name === COLLECTION_NAME);
  if (alreadyExists) {
    console.warn(`⚠ Collection "${COLLECTION_NAME}" đã tồn tại (id: ${alreadyExists.id})`);
    console.warn('  Xóa thủ công trong Figma rồi chạy lại nếu muốn tạo mới.');
    process.exit(0);
  }

  // Tạo IDs tạm (Figma sẽ thay bằng IDs thật sau khi tạo)
  const collId = 'temp:collection';
  const modeIds = { 1280: 'temp:mode-1280', 1440: 'temp:mode-1440', 1920: 'temp:mode-1920' };

  // Build payload
  const tokenNames = Object.keys(TOKENS);

  const payload = {
    variableCollections: [
      {
        action: 'CREATE',
        id: collId,
        name: COLLECTION_NAME,
        initialModeId: modeIds[1280],
      },
    ],

    variableModes: MODES.map(bp => ({
      action: 'CREATE',
      id: modeIds[bp],
      name: String(bp),
      variableCollectionId: collId,
    })),

    variables: tokenNames.map(name => ({
      action: 'CREATE',
      id: `temp:var-${name}`,
      name,
      variableCollectionId: collId,
      resolvedType: 'FLOAT',
      description: `Font size token: ${MODES.map(bp => `${bp}→${TOKENS[name][bp]}px`).join(', ')}`,
    })),

    variableModeValues: tokenNames.flatMap(name =>
      MODES.map(bp => ({
        variableId: `temp:var-${name}`,
        modeId: modeIds[bp],
        value: TOKENS[name][bp],
      }))
    ),
  };

  console.log(`\nTạo collection "${COLLECTION_NAME}" với ${MODES.length} modes và ${tokenNames.length} variables...`);
  console.log('Tokens:');
  for (const [name, vals] of Object.entries(TOKENS)) {
    console.log(`  ${name.padEnd(4)}: ${MODES.map(bp => `${bp}→${vals[bp]}px`).join('  ')}`);
  }

  const result = await figmaPost(`/files/${FILE_KEY}/variables`, payload);

  // In IDs thật được trả về (cần cho plugin step tiếp theo)
  console.log('\n✓ Tạo thành công!\n');

  const createdCollections = result.meta?.createdVariableCollections ?? {};
  const createdModes      = result.meta?.createdVariableModes ?? {};
  const createdVars       = result.meta?.createdVariables ?? {};

  const realCollId = createdCollections[collId];
  console.log(`Collection ID: ${realCollId}`);

  console.log('Mode IDs:');
  for (const bp of MODES) {
    console.log(`  ${bp}: ${createdModes[modeIds[bp]]}`);
  }

  console.log('Variable IDs:');
  for (const name of tokenNames) {
    console.log(`  ${name.padEnd(4)}: ${createdVars[`temp:var-${name}`]}`);
  }

  // Lưu IDs ra file để plugin dùng
  const ids = {
    collectionId: realCollId,
    modeIds: Object.fromEntries(MODES.map(bp => [bp, createdModes[modeIds[bp]]])),
    variableIds: Object.fromEntries(
      tokenNames.map(name => [name, createdVars[`temp:var-${name}`]])
    ),
  };

  const { writeFileSync } = await import('fs');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const __dir = dirname(fileURLToPath(import.meta.url));
  writeFileSync(join(__dir, 'variable-ids.json'), JSON.stringify(ids, null, 2));
  console.log('\nĐã lưu IDs vào variable-ids.json (plugin sẽ dùng file này)');
}

main().catch(err => {
  console.error('\nLỗi:', err.message);
  process.exit(1);
});
