#!/usr/bin/env node
import { validateProject } from './lib/project-check.mjs';

const directory = process.argv[2];
if (!directory) {
  console.error('Usage: node scripts/validate_project.mjs <generated-app-directory>');
  process.exit(2);
}
try {
  const report = await validateProject(directory);
  console.log(`Valid offline project: ${report.files} checked files | keyboard rows present | prompt footprint stable`);
} catch (error) {
  console.error(`Project validation failed:\n${error.message}`);
  process.exit(1);
}
