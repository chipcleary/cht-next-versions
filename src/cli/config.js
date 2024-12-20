import fs from 'fs/promises';
import { join } from 'path';
import { createRequire } from 'module';
import { logger } from '../logging/logger.js';

const require = createRequire(import.meta.url);

export const DEFAULT_CONFIG = {
  region: 'us-central1',
  repository: 'cloud-run-source-deploy',
};

export async function loadConfig() {
  try {
    const configPath = join(process.cwd(), 'cht-next-versions.config.cjs');
    try {
      await fs.access(configPath);
      logger.debug(`(loadConfig) ${configPath}`);
    } catch {
      logger.info('(loadConfig) No config file found, using defaults.');
      return DEFAULT_CONFIG;
    }
    const userConfig = await require(configPath);
    logger.debug('(loadConfig) Loaded user config:', userConfig);
    const mergedConfig = {
      ...DEFAULT_CONFIG,
      ...userConfig,
    };
    logger.debug('(loadConfig) Merged config:', mergedConfig);
    return mergedConfig;
  } catch (error) {
    logger.warn(`(loadConfig) Error loading config: ${error.message}`);
    logger.warn('(loadConfig) Using default configuration.');
    return DEFAULT_CONFIG;
  }
}
