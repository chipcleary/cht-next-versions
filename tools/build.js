/**
 * Build Script for @chipcleary/cht-next-versions
 *
 * Purpose:
 * This script prepares the package for distribution by creating a clean build
 * in the dist/ directory. While the current implementation simply copies files,
 * this script serves as a foundation for future build steps such as:
 * - Transpiling code for older Node versions
 * - Minifying/optimizing code
 * - Processing TypeScript or other pre-processors
 * - Generating sourcemaps
 * - Creating different bundles (ESM, CJS) for different environments
 *
 * Current Process:
 * 1. Creates a clean dist/ directory
 * 2. Copies all source files to dist/
 *
 * Usage:
 * - Run directly: node tools/build.js
 * - Via npm script: npm run build
 *
 * Note: This script uses the Node.js ESM module system, as indicated by
 * "type": "module" in package.json
 */

import { mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Convert ESM module URL to directory path
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function build() {
  try {
    // Create dist directory (and parent directories if needed)
    await mkdir(join(rootDir, 'dist'), { recursive: true });

    // Copy source files to dist
    await cp(join(rootDir, 'src'), join(rootDir, 'dist'), { recursive: true });

    console.log('✨ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Execute build
build();
