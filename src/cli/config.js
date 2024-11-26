import fs from 'fs/promises';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const DEFAULT_CONFIG = {
  region: 'us-central1',
  repository: 'cloud-run-source-deploy',
  hooks: {}
};

export async function loadConfig() {
  try {
    // Look for config file in current directory
    const configPath = join(process.cwd(), 'cht-next-versions.config.cjs');

    // Check if config exists
    try {
      await fs.access(configPath);
    } catch {
      console.log('No config file found, using defaults.');
      return DEFAULT_CONFIG;
    }

    // Load config using require (for CJS)
    const userConfig = require(configPath);

    // Merge with defaults
    return {
      ...DEFAULT_CONFIG,
      ...userConfig,
      hooks: {
        ...DEFAULT_CONFIG.hooks,
        ...userConfig.hooks
      }
    };
  } catch (error) {
    console.warn('Error loading config:', error.message);
    console.log('Using default configuration.');
    return DEFAULT_CONFIG;
  }
}
