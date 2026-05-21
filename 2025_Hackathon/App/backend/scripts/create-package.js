/**
 * Metaverse Social Practice - Deployment Package Creator
 * 
 * This script creates a deployment package for the backend application.
 * It uses archiver to create a zip file with all the necessary files.
 * Simplified to focus on essential files only.
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Paths
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const nodeModulesDir = path.join(rootDir, 'node_modules');
const packageJsonPath = path.join(rootDir, 'package.json');
const webConfigPath = path.join(rootDir, 'web.config');
const startupJsPath = path.join(rootDir, 'startup.js');
const deployDir = path.join(rootDir, 'deploy');
const zipFilePath = path.join(deployDir, 'metaverse-social-backend.zip');

// Create a file to stream archive data to
const output = fs.createWriteStream(zipFilePath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(`✅ Archive created: ${zipFilePath}`);
  console.log(`📦 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

// Good practice to catch warnings and errors
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('⚠️ Warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  console.error('❌ Error during archive creation:', err);
  process.exit(1);
});

// Pipe archive data to the file
archive.pipe(output);

console.log('📁 Creating deployment package...');

// Add essential files only
console.log('📂 Adding dist directory...');
archive.directory(distDir, 'dist');

console.log('📄 Adding package.json...');
archive.file(packageJsonPath, { name: 'package.json' });

// Add web.config if it exists
if (fs.existsSync(webConfigPath)) {
  console.log('📄 Adding web.config...');
  archive.file(webConfigPath, { name: 'web.config' });
}

// Add startup.js
console.log('📄 Adding startup.js...');
archive.file(startupJsPath, { name: 'startup.js' });

// Add node_modules directory (already pruned to production dependencies)
console.log('📂 Adding node_modules directory...');
archive.directory(nodeModulesDir, 'node_modules');

// Finalize the archive
console.log('🔒 Finalizing archive...');
archive.finalize();
