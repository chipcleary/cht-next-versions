#!/usr/bin/env node
import { Command } from 'commander';
import { deploy } from '@cht/next-versions/cli';
import { logger } from '@cht/next-versions';

try {
  const program = new Command();

  program
    .name('deploy')
    .description('Deploy a specific version')
    .arguments('<version>')
    .option('--log-level <level>', 'logging level', 'info')
    .action(async (version, options) => {
      try {
        await deploy(version, { logLevel: options.logLevel });
      } catch (error) {
        logger.error('Deployment failed:', error);
        process.exit(1);
      }
    });

  program.parse(process.argv);
} catch (err) {
  console.error('Error setting up commander:', err);
  process.exit(1);
}
