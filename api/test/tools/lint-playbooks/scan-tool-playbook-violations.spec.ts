import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { scanToolPlaybookViolations } from './scan-tool-playbook-violations';

describe('scanToolPlaybookViolations', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'playbook-lint-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const write = (rel: string, content: string): void => {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  };

  it('passes when a decorated class has a non-empty playbook literal', () => {
    write(
      'tool.ts',
      `
      @RegisterAssistantTool()
      class FooTool {
        readonly name = 'foo';
        readonly playbook = 'Do the thing carefully.';
      }
      `,
    );
    expect(scanToolPlaybookViolations({ rootDir: root })).toEqual([]);
  });

  it('flags an empty string literal playbook', () => {
    write(
      'tool.ts',
      `
      @RegisterAssistantTool()
      class FooTool {
        readonly name = 'foo';
        readonly playbook = '';
      }
      `,
    );
    const violations = scanToolPlaybookViolations({ rootDir: root });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      className: 'FooTool',
      reason: expect.stringMatching(/empty/i) as unknown,
    });
  });

  it('flags a whitespace-only playbook', () => {
    write(
      'tool.ts',
      `
      @RegisterAssistantTool()
      class FooTool {
        readonly playbook = '   ';
      }
      `,
    );
    const violations = scanToolPlaybookViolations({ rootDir: root });
    expect(violations).toHaveLength(1);
    expect(violations[0].reason).toMatch(/empty/i);
  });

  it('flags a missing playbook field', () => {
    write(
      'tool.ts',
      `
      @RegisterAssistantTool()
      class FooTool {
        readonly name = 'foo';
      }
      `,
    );
    const violations = scanToolPlaybookViolations({ rootDir: root });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      className: 'FooTool',
      reason: expect.stringMatching(/missing/i) as unknown,
    });
  });

  it('accepts a playbook that references an identifier (trusts type system)', () => {
    write(
      'tool.ts',
      `
      const FOO_PLAYBOOK = 'external';
      @RegisterAssistantTool()
      class FooTool {
        readonly playbook = FOO_PLAYBOOK;
      }
      `,
    );
    expect(scanToolPlaybookViolations({ rootDir: root })).toEqual([]);
  });

  it('accepts a playbook that references a member access', () => {
    write(
      'tool.ts',
      `
      @RegisterAssistantTool()
      class FooTool {
        readonly playbook = FOO.playbook;
      }
      `,
    );
    expect(scanToolPlaybookViolations({ rootDir: root })).toEqual([]);
  });

  it('ignores classes without the decorator', () => {
    write(
      'tool.ts',
      `
      class NotATool {
        readonly playbook = '';
      }
      `,
    );
    expect(scanToolPlaybookViolations({ rootDir: root })).toEqual([]);
  });

  it('scans multiple decorated classes in the same file', () => {
    write(
      'tools.ts',
      `
      @RegisterAssistantTool()
      class OkTool {
        readonly playbook = 'ok';
      }
      @RegisterAssistantTool()
      class BadTool {
        readonly playbook = '';
      }
      `,
    );
    const violations = scanToolPlaybookViolations({ rootDir: root });
    expect(violations).toHaveLength(1);
    expect(violations[0].className).toBe('BadTool');
  });

  it('recurses into subdirectories', () => {
    write(
      'sub/nested.ts',
      `
      @RegisterAssistantTool()
      class NestedTool {
        readonly playbook = '';
      }
      `,
    );
    const violations = scanToolPlaybookViolations({ rootDir: root });
    expect(violations).toHaveLength(1);
    expect(violations[0].file).toContain('nested.ts');
  });

  it('flags a playbook literal that references the name of another tool', () => {
    write(
      'tools.ts',
      `
      @RegisterAssistantTool()
      class AddTool {
        readonly name = 'add_transaction';
        readonly playbook = 'Adiciona uma transação. Depois chame remove_transaction para limpar.';
      }
      @RegisterAssistantTool()
      class RemoveTool {
        readonly name = 'remove_transaction';
        readonly playbook = 'Remove uma transação.';
      }
      `,
    );
    const violations = scanToolPlaybookViolations({ rootDir: root });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      className: 'AddTool',
      reason: expect.stringMatching(/remove_transaction/) as unknown,
    });
  });

  it('allows a playbook to mention its own tool name (self-reference)', () => {
    write(
      'tool.ts',
      `
      @RegisterAssistantTool()
      class HelpTool {
        readonly name = 'get_tool_help';
        readonly playbook = 'Chame get_tool_help antes de usar uma tool pela primeira vez.';
      }
      `,
    );
    expect(scanToolPlaybookViolations({ rootDir: root })).toEqual([]);
  });

  it('detects cross-references across separate files', () => {
    write(
      'a.ts',
      `
      @RegisterAssistantTool()
      class AddTool {
        readonly name = 'add_transaction';
        readonly playbook = 'Adiciona. Se falhar, chame remove_transaction.';
      }
      `,
    );
    write(
      'b.ts',
      `
      @RegisterAssistantTool()
      class RemoveTool {
        readonly name = 'remove_transaction';
        readonly playbook = 'Remove.';
      }
      `,
    );
    const violations = scanToolPlaybookViolations({ rootDir: root });
    expect(violations).toHaveLength(1);
    expect(violations[0].className).toBe('AddTool');
  });

  it('does not confuse substrings for tool name mentions (word boundary)', () => {
    write(
      'tools.ts',
      `
      @RegisterAssistantTool()
      class AddTool {
        readonly name = 'add_transaction';
        readonly playbook = 'Aceita valores positivos em add_transactions_bulk_operations_scope.';
      }
      @RegisterAssistantTool()
      class BulkTool {
        readonly name = 'add_transactions_bulk';
        readonly playbook = 'Bulk.';
      }
      `,
    );
    expect(scanToolPlaybookViolations({ rootDir: root })).toEqual([]);
  });

  it('does not cross-check when playbook is not a string literal', () => {
    write(
      'tools.ts',
      `
      const ADD_PB = 'Adiciona. Depois remove_transaction.';
      @RegisterAssistantTool()
      class AddTool {
        readonly name = 'add_transaction';
        readonly playbook = ADD_PB;
      }
      @RegisterAssistantTool()
      class RemoveTool {
        readonly name = 'remove_transaction';
        readonly playbook = 'Remove.';
      }
      `,
    );
    expect(scanToolPlaybookViolations({ rootDir: root })).toEqual([]);
  });
});
