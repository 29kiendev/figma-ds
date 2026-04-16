// Debug plugin — chạy riêng, chỉ log, không thay đổi file
// Đổi main trong manifest.json thành "debug.js" để chạy

async function debug() {
  // 1. Tìm frame "1280"
  var sourceFrame = null;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var page = figma.root.children[pi];
    var children = page.children || [];
    for (var ci = 0; ci < children.length; ci++) {
      if (children[ci].type === 'FRAME' && children[ci].name === '1280') {
        sourceFrame = children[ci];
        console.log('Found frame "1280" on page: ' + page.name);
        break;
      }
    }
    if (sourceFrame) break;
  }
  if (!sourceFrame) { figma.closePlugin('Frame 1280 not found'); return; }

  // 2. Tìm variable collection
  var collections = figma.variables.getLocalVariableCollections();
  console.log('Total collections: ' + collections.length);
  var collection = null;
  for (var i = 0; i < collections.length; i++) {
    console.log('  Collection: ' + collections[i].name + ' | modes: ' + collections[i].modes.map(function(m){ return m.name; }).join(', '));
    if (collections[i].name === 'Font Size') collection = collections[i];
  }

  var testVar = null;
  if (collection) {
    var vars = figma.variables.getLocalVariables('FLOAT');
    for (var vi = 0; vi < vars.length; vi++) {
      if (vars[vi].variableCollectionId === collection.id && vars[vi].name === 'base') {
        testVar = vars[vi];
        console.log('Found variable "base": ' + testVar.id);
        break;
      }
    }
  }

  // 3. Walk text nodes, thử bind node đầu tiên là Arial
  var tried = 0;
  function walk(node) {
    if (node.type === 'TEXT') {
      var family = node.fontName === figma.mixed ? '(mixed)' : node.fontName.family;
      var size = node.fontSize === figma.mixed ? '(mixed)' : node.fontSize;
      console.log('TEXT: "' + node.name + '" | font: ' + family + ' | size: ' + size + ' | id: ' + node.id);

      // Thử bind node Arial đầu tiên với variable "base"
      if (tried === 0 && family === 'Arial' && testVar && size === 14) {
        tried++;
        figma.loadFontAsync(node.fontName).then(function() {
          try {
            node.setBoundVariable('fontSize', testVar);
            console.log('SUCCESS bind on: ' + node.name);
          } catch(e) {
            console.log('FAIL bind: ' + e.message);
          }
        }).catch(function(e) {
          console.log('FAIL loadFont: ' + e.message);
        });
      }
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) walk(node.children[i]);
    }
  }
  walk(sourceFrame);

  figma.closePlugin('Debug done — check console');
}

debug();
