import fs from 'fs';
import path from 'path';

function findFilesRecursively(dir: string, pattern: RegExp): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findFilesRecursively(fullPath, pattern));
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Architecture & Layer Dependency Rules (Fitness Functions)', () => {
  const srcRoot = path.resolve(__dirname, '../../src');

  it('RULE 1: Domain layer must NEVER import express, mongoose, mongodb, redis, or third-party infrastructure', () => {
    const domainFiles = findFilesRecursively(srcRoot, /\.ts$/).filter((f) =>
      f.includes(path.sep + 'domain' + path.sep)
    );

    expect(domainFiles.length).toBeGreaterThan(0);

    const forbiddenImports = [
      'express',
      'mongoose',
      'mongodb',
      'ioredis',
      'redis',
      'bullmq',
      'nodemailer',
      'axios',
    ];

    const violations: { file: string; match: string }[] = [];

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const forbidden of forbiddenImports) {
        const regex = new RegExp(`from\\s+['"]${forbidden}['"]`, 'g');
        if (regex.test(content)) {
          violations.push({ file: path.relative(srcRoot, file), match: forbidden });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('RULE 2: Application layer must NEVER import Express Request or Response', () => {
    const applicationFiles = findFilesRecursively(srcRoot, /\.ts$/).filter((f) =>
      f.includes(path.sep + 'application' + path.sep)
    );

    expect(applicationFiles.length).toBeGreaterThan(0);

    const violations: { file: string; match: string }[] = [];

    for (const file of applicationFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/from\s+['"]express['"]/.test(content)) {
        violations.push({ file: path.relative(srcRoot, file), match: 'express' });
      }
    }

    expect(violations).toEqual([]);
  });

  it('RULE 3: Presentation layer must NEVER import Mongoose models directly', () => {
    const presentationFiles = findFilesRecursively(srcRoot, /\.ts$/).filter((f) =>
      f.includes(path.sep + 'presentation' + path.sep)
    );

    expect(presentationFiles.length).toBeGreaterThan(0);

    const violations: { file: string; match: string }[] = [];

    for (const file of presentationFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/\.model['"]/.test(content)) {
        violations.push({ file: path.relative(srcRoot, file), match: '.model import' });
      }
    }

    expect(violations).toEqual([]);
  });
});
