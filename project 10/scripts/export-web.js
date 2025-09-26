// scripts/export-web.js
const { spawn } = require('child_process');

// Clone current env and remove variables that can break project root detection
const env = { ...process.env };
delete env.EXPO_PROJECT_ROOT;
delete env.EXPO_ROOT;
delete env.REACT_NATIVE_PATH;

// NOTE: We rely on local expo via `npm exec`, not global `expo` command.
const args = ['exec', 'expo', 'export', '--', '--platform', 'web', '--output-dir', 'dist'];

console.log('> Running:', 'npm', args.join(' '));
const child = spawn('npm', args, { stdio: 'inherit', env, cwd: process.cwd() });

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('Failed to spawn export:', err);
  process.exit(1);
});