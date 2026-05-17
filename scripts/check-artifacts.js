#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const CWD = process.cwd();

function getReviewPath(specPath) {
  const rel = path.relative(CWD, specPath);
  const dir = path.dirname(rel);
  const basename = path.basename(rel);

  if (rel === 'technical-specification.md') {
    return path.join(CWD, '.artifacts', 'review.md');
  }

  return path.join(CWD, dir, '.artifacts', basename, 'review.md');
}

function getReviewStatus(specPath) {
  const reviewPath = getReviewPath(specPath);

  if (!fs.existsSync(reviewPath)) return { reviewFile: null, reviewMtime: null, reviewStatus: "MISSING" };

  const reviewMtime = fs.statSync(reviewPath).mtimeMs;
  const specMtime = fs.statSync(specPath).mtimeMs;
  const status = reviewMtime < specMtime ? "STALE" : "OK";

  return {
    reviewFile: path.relative(CWD, reviewPath),
    reviewMtime: Math.floor(reviewMtime),
    reviewStatus: status,
  };
}

function getAllSpecFiles() {
  const files = [];

  const rootSpec = path.join(CWD, 'technical-specification.md');
  if (fs.existsSync(rootSpec)) files.push(rootSpec);

  const srcDir = path.join(CWD, 'src');
  if (!fs.existsSync(srcDir)) return files;

  for (const entry of fs.readdirSync(srcDir)) {
    const moduleDir = path.join(srcDir, entry);
    if (!fs.statSync(moduleDir).isDirectory()) continue;

    for (const file of fs.readdirSync(moduleDir)) {
      if (file.endsWith('.spec.md')) {
        files.push(path.join(moduleDir, file));
      }
    }
  }

  return files;
}

function getModuleSpecFiles(name) {
  const moduleDir = path.join(CWD, 'src', name);
  if (!fs.existsSync(moduleDir) || !fs.statSync(moduleDir).isDirectory()) {
    console.error(`ERROR: No such module: "${name}" (not found at src/${name}/)`);
    process.exit(1);
  }

  const files = [];
  for (const file of fs.readdirSync(moduleDir)) {
    if (file.endsWith('.spec.md')) {
      files.push(path.join(moduleDir, file));
    }
  }

  return files;
}

function main() {
  const args = process.argv.slice(2);
  const issuesOnly = args.includes('--errors');
  const subModuleIdx = args.indexOf('--sub-module');
  const fileIdx = args.indexOf('--file');

  let specFiles;

  if (subModuleIdx !== -1) {
    const moduleName = args[subModuleIdx + 1];
    if (!moduleName) {
      console.error('Usage: node scripts/check-artifacts.js --sub-module <name>');
      process.exit(1);
    }
    specFiles = getModuleSpecFiles(moduleName);
  } else if (fileIdx !== -1) {
    const filePath = args[fileIdx + 1];
    if (!filePath) {
      console.error('Usage: node scripts/check-artifacts.js --file <path>');
      process.exit(1);
    }
    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`ERROR: File not found: ${filePath}`);
      process.exit(1);
    }
    if (!resolvedPath.endsWith('.spec.md')) {
      console.error(`ERROR: Not a .spec.md file: ${filePath}`);
      process.exit(1);
    }
    specFiles = [resolvedPath];
  } else {
    specFiles = getAllSpecFiles();
  }

  const results = specFiles.map(specPath => {
    const relSpecPath = path.relative(CWD, specPath);
    const specMtime = fs.statSync(specPath).mtimeMs;
    const review = getReviewStatus(specPath);

    return {
      specFile: relSpecPath,
      specMtime: Math.floor(specMtime),
      reviewFile: review.reviewFile,
      reviewMtime: review.reviewMtime,
      reviewStatus: review.reviewStatus,
    };
  });

  const output = issuesOnly ? results.filter(r => r.reviewStatus !== "OK") : results;

  console.log(JSON.stringify(output, null, 2));
}

main();
