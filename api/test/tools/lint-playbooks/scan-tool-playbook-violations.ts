import { readFileSync } from 'node:fs';

import { PLAYBOOK_REGEX } from './constants/regex';
import type { PlaybookViolation } from './types/playbook-violation';
import { collectTypescriptFiles } from './utils/collect-typescript-files';

const DECORATOR_MARKER = '@RegisterAssistantTool';

interface ToolDeclaration {
  readonly file: string;
  readonly className: string;
  readonly name: string | null;
  readonly playbookLiteral: string | null;
  readonly hasPlaybookField: boolean;
}

export const scanToolPlaybookViolations = (params: {
  readonly rootDir: string;
}): PlaybookViolation[] => {
  const declarations: ToolDeclaration[] = [];

  for (const file of collectTypescriptFiles(params.rootDir)) {
    const source = readFileSync(file, 'utf8');
    if (!source.includes(DECORATOR_MARKER)) continue;

    for (const decl of parseFileDeclarations(file, source)) {
      declarations.push(decl);
    }
  }

  return emitViolations(declarations);
};

const parseFileDeclarations = (
  file: string,
  source: string,
): ToolDeclaration[] => {
  const declarations: ToolDeclaration[] = [];
  const scopes = source.split(PLAYBOOK_REGEX.decoratorSplit).slice(1);

  for (const scope of scopes) {
    const nameMatch = PLAYBOOK_REGEX.className.exec(scope);
    if (!nameMatch) continue;

    const literalMatch = PLAYBOOK_REGEX.playbookLiteral.exec(scope);
    const anyMatch = PLAYBOOK_REGEX.playbookAny.exec(scope);
    const nameLiteralMatch = PLAYBOOK_REGEX.nameLiteral.exec(scope);

    declarations.push({
      file,
      className: nameMatch[1],
      name: nameLiteralMatch ? nameLiteralMatch[2] : null,
      playbookLiteral: literalMatch ? literalMatch[2] : null,
      hasPlaybookField: Boolean(literalMatch ?? anyMatch),
    });
  }

  return declarations;
};

const emitViolations = (
  declarations: readonly ToolDeclaration[],
): PlaybookViolation[] => {
  const violations: PlaybookViolation[] = [];
  const knownNames = declarations
    .map((decl) => decl.name)
    .filter((name): name is string => name !== null);

  for (const decl of declarations) {
    if (!decl.hasPlaybookField) {
      violations.push({
        file: decl.file,
        className: decl.className,
        reason: 'missing playbook field',
      });
      continue;
    }

    if (decl.playbookLiteral === null) continue;

    if (decl.playbookLiteral.trim().length === 0) {
      violations.push({
        file: decl.file,
        className: decl.className,
        reason: 'playbook literal is empty',
      });
      continue;
    }

    const foreign = findForeignToolMention({
      playbook: decl.playbookLiteral,
      ownName: decl.name,
      knownNames,
    });
    if (foreign) {
      violations.push({
        file: decl.file,
        className: decl.className,
        reason: `playbook references another tool: ${foreign}`,
      });
    }
  }

  return violations;
};

const findForeignToolMention = (params: {
  readonly playbook: string;
  readonly ownName: string | null;
  readonly knownNames: readonly string[];
}): string | null => {
  for (const candidate of params.knownNames) {
    if (candidate === params.ownName) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(candidate)}\\b`);
    if (pattern.test(params.playbook)) return candidate;
  }
  return null;
};

const escapeRegExp = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
