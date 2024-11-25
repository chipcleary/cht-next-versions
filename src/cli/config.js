const fs = require('fs').promises;
const path = require('path');

const DEFAULT_CONFIG = {
  region: 'us-central1',
  repository: 'cloud-run-source-deploy',
  hooks: {}
};

async function loadConfig() {
  try {
    // Look for config file in current directory
    const configPath = path.join(process.cwd(), 'cht-next-versions.config.js');

    // Check if config exists
    try {
      await fs.access(configPath);
    } catch {
      console.log('No config file found, using defaults.');
      return DEFAULT_CONFIG;
    }

    // Load config
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

module.exports = {
  loadConfig,
  DEFAULT_CONFIG
};
