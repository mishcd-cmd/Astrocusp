// scripts/spa-fallback.js
const fs = require('fs');
const path = require('path');

const idx = path.join('dist', 'index.html');
const twoHundred = path.join('dist', '200.html');

if (fs.existsSync(idx)) {
  fs.copyFileSync(idx, twoHundred);
  console.log('✅ Created dist/200.html for SPA routing');
} else {
  console.error('❌ No dist/index.html found after export');
  process.exit(1);
}