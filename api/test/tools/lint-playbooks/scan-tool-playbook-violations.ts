import { readFileSync } from 'node:fs';

import { PLAYBOOK_REGEX } from './constants/regex';
import type { PlaybookViolation } from './types/playbook-violation';
import { collectTypescriptFiles } from './utils/collect-typescript-files';

const DECORATOR_MARKER = '@RegisterAssistantTool';

export const scanToolPlaybookViolations = (params: {
  readonly rootDir: string;
}): PlaybookViolation[] => {
  const violations: PlaybookViolation[] = [];

  for (const file of collectTypescriptFiles(params.rootDir)) {
    const source = readFileSync(file, 'utf8');
    if (!source.includes(DECORATOR_MARKER)) continue;

    const scopes = source.split(PLAYBOOK_REGEX.decoratorSplit).slice(1);
    for (const scope of scopes) {
      const nameMatch = PLAYBOOK_REGEX.className.exec(scope);
      if (!nameMatch) continue;
      const className = nameMatch[1];

      const literalMatch = PLAYBOOK_REGEX.playbookLiteral.exec(scope);
      if (literalMatch) {
        if (literalMatch[2].trim().length === 0) {
          violations.push({
            file,
            className,
            reason: 'playbook literal is empty',
          });
        }
        continue;
      }

      const anyMatch = PLAYBOOK_REGEX.playbookAny.exec(scope);
      if (!anyMatch) {
        violations.push({
          file,
          className,
          reason: 'missing playbook field',
        });
      }
    }
  }

  return violations;
};
