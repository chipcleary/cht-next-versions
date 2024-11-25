#!/usr/bin/env node
const { deploy } = require('@cht/next-versions/cli');

// Get version from command line argument
const version = process.argv[2];

// Run deployment
deploy(version).catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
