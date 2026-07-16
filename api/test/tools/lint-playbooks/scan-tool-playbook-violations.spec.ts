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
});
