#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '..', 'catalog.json');
if (!fs.existsSync(catalogPath)) {
  console.error('Error: catalog.json not found');
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const query = process.argv[2];

if (!query) {
  console.log('Usage: node elevate.js <agent-slug-or-name> [--global]');
  console.log('Example: node elevate.js frontend-developer');
  process.exit(0);
}

const isGlobal = process.argv.includes('--global');
const cleanQuery = query.toLowerCase().replace(/^agency-/, '');

const agent = catalog.find(a => a.slug === cleanQuery || a.slug.includes(cleanQuery) || a.name.toLowerCase().includes(cleanQuery));

if (!agent) {
  console.error(`Agent "${query}" not found in catalog.`);
  process.exit(1);
}

const targetBase = isGlobal 
  ? path.join(process.env.USERPROFILE || 'C:\\Users\\Mubashir Khan', '.gemini', 'config', 'skills')
  : path.resolve(__dirname, '..', '..');

const skillName = `agency-${agent.slug}`;
const targetDir = path.join(targetBase, skillName);
const targetFile = path.join(targetDir, 'SKILL.md');

const srcFile = path.resolve(__dirname, '..', agent.targetRelPath);
if (!fs.existsSync(srcFile)) {
  console.error(`Source file "${srcFile}" not found.`);
  process.exit(1);
}

const srcContent = fs.readFileSync(srcFile, 'utf8');
let body = srcContent;
const fmMatch = srcContent.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
if (fmMatch) body = fmMatch[1];

const outputSkill = `---
name: ${skillName}
description: >-
  ${agent.description.replace(/\n/g, ' ')}
---

${body.trim()}
`;

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(targetFile, outputSkill, 'utf8');

console.log(`Successfully elevated ${agent.name} to standalone skill:`);
console.log(targetFile);
