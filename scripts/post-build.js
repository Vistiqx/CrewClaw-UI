#!/usr/bin/env node
/**
 * Post-build script to copy static files to standalone directory
 * This ensures the standalone build has all necessary CSS, JS, and media files
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', '.next', 'static');
const targetDir = path.join(__dirname, '..', '.next', 'standalone', '.next', 'static');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source directory does not exist: ${src}`);
    return;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
    console.log(`Created directory: ${dest}`);
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${path.relative(process.cwd(), srcPath)} -> ${path.relative(process.cwd(), destPath)}`);
    }
  }
}

console.log('Running post-build script...');
console.log(`Source: ${sourceDir}`);
console.log(`Target: ${targetDir}`);

try {
  copyRecursive(sourceDir, targetDir);
  console.log('\nPost-build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\nPost-build failed:', error.message);
  process.exit(1);
}
