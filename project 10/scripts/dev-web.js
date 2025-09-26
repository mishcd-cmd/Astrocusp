// scripts/dev-web.js
const { spawn } = require('child_process');

// Clone env and remove variables that can confuse Expo about the project root
const env = { ...process.env };
delete env.EXPO_PROJECT_ROOT;
delete env.EXPO_ROOT;
delete env.REACT_NATIVE_PATH;

// Prefer passing flags after `--` and use --port=8081 (single token)
const args = ['exec', 'expo', 'start', '--', '--web', '--port=8081'];

console.log('> Running:', 'npm', args.join(' '));
const child = spawn('npm', args, {
  stdio: 'inherit',
  env,
  cwd: process.cwd(),   // ensure we run from the current folder (your project root)
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('Failed to start Expo:', err);
  process.exit(1);
});