const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const rootJsDir = path.join(__dirname, '../../js');
const publicJsDir = path.join(__dirname, '../public/js');

// Ensure public js dir exists
if (!fs.existsSync(publicJsDir)) {
  fs.mkdirSync(publicJsDir, { recursive: true });
}

const bundles = {
  'core-effects.js': [
    'windowcanvas-lock.js',
    'window-float-layer.js',
    'retro-window-interaction.js',
    'supabase-image-fallback.js'
  ],
  'visual-effects.js': [
    'breathing-shadow-apply.js',
    'drag-echo-effect.js',
    'pixel-image-load-effect.js',
    'window-randomizer.js',
    'drag-and-drop-icons.js'
  ]
};

function bundle() {
  console.log('\x1b[36m[JS Bundler]\x1b[0m Bundling JS files...');
  
  let hasErrors = false;

  for (const [bundleName, files] of Object.entries(bundles)) {
    let content = `/* === BUNDLE: ${bundleName} === */\n`;
    content += `/* Combined: ${files.join(', ')} */\n\n`;
    
    let fileCount = 0;
    for (const file of files) {
      const filePath = path.join(rootJsDir, file);
      if (fs.existsSync(filePath)) {
        content += fs.readFileSync(filePath, 'utf8') + '\n\n';
        fileCount++;
      } else {
        console.warn(`\x1b[33m[JS Bundler] Warning: Source file ${file} not found for ${bundleName}\x1b[0m`);
        hasErrors = true;
      }
    }
    
    if (fileCount > 0) {
        fs.writeFileSync(path.join(publicJsDir, bundleName), content);
        console.log(`\x1b[32m[JS Bundler] Created ${bundleName} (${fileCount} files)\x1b[0m`);
    }
  }
  
  if (!hasErrors) {
      console.log('\x1b[32m[JS Bundler] Build complete.\x1b[0m');
  }
}

if (process.argv.includes('--watch')) {
  console.log('\x1b[36m[JS Bundler] Watching for changes in js/ folder...\x1b[0m');
  
  // Try to use chokidar if available, otherwise fallback to fs.watch
  try {
    const chokidar = require('chokidar');
    chokidar.watch(rootJsDir).on('change', (filePath) => {
      console.log(`\x1b[36m[JS Bundler] File changed: ${path.basename(filePath)}\x1b[0m`);
      bundle();
    });
  } catch (e) {
    console.log('\x1b[33m[JS Bundler] Chokidar not found, using fs.watch (less reliable)\x1b[0m');
    fs.watch(rootJsDir, (eventType, filename) => {
        if (filename && filename.endsWith('.js')) {
             console.log(`\x1b[36m[JS Bundler] File changed: ${filename}\x1b[0m`);
             bundle();
        }
    });
  }
  
  // Initial bundle
  bundle();
} else {
  bundle();
}

