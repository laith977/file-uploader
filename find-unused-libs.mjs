#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

const projectRoot = process.cwd();

// 1. Read and collect declared dependencies
const packageJson = JSON.parse(
  readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
);
const declaredDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};
const dependencies = Object.keys(declaredDeps);

// 2. Settings
const allowedExts = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']);
const excludeDirs = new Set(['node_modules', '.git']);

// 3. Will hold all matched dependencies
const foundDeps = new Set();

// 4. Precompile regexes for faster testing
const depRegexes = dependencies.map((dep) => ({
  dep,
  regex: new RegExp(`['"\`]${dep}['"\`]`),
}));

// 5. Recursive scanning
function scanDir(dir) {
  for (const entry of readdirSync(dir)) {
    if (excludeDirs.has(entry)) continue;

    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (stat.isFile()) {
      if (allowedExts.has(path.extname(entry))) {
        checkFile(fullPath);
      }
    }
  }
}

// 6. Check individual file for dependency usage
function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf8');

  for (const { dep, regex } of depRegexes) {
    if (!foundDeps.has(dep) && regex.test(content)) {
      foundDeps.add(dep);
      // Early exit if all are found
      if (foundDeps.size === dependencies.length) {
        return;
      }
    }
  }
}

// 7. Run scan
scanDir(projectRoot);

// 8. Report
const unused = dependencies.filter((dep) => !foundDeps.has(dep));
console.log('\nUnused dependencies:');
console.log(unused.length ? unused.join('\n') : 'None found');
