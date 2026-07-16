import { readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

export const collectTypescriptFiles = (
  rootDir: string,
  accumulator: string[] = [],
): string[] => {
  for (const entry of readdirSync(rootDir)) {
    const fullPath = join(rootDir, entry);
    if (statSync(fullPath).isDirectory()) {
      collectTypescriptFiles(fullPath, accumulator);
      continue;
    }
    if (extname(fullPath) === '.ts') accumulator.push(fullPath);
  }
  return accumulator;
};
