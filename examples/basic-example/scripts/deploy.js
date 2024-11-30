#!/usr/bin/env node

import { program } from 'commander';
import { deploy } from '@cht/next-versions/cli';
import { logger } from '@cht/next-versions';

program
  .argument('<version>', 'version to deploy')
  .option('--log-level <level>', 'logging level', 'info')
  .action(async (version, options) => {
    try {
      await deploy(version, { logLevel: options.logLevel });
    } catch (error) {
      logger.error('Deployment failed:', error);
      process.exit(1);
    }
  });

program.parse();
