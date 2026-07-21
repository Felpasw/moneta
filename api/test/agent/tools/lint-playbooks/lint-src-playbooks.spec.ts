import { resolve } from 'node:path';

import { scanToolPlaybookViolations } from './scan-tool-playbook-violations';

describe('AssistantTool playbook linter (src/)', () => {
  it('every @RegisterAssistantTool class in src/ declares a non-empty playbook', () => {
    const violations = scanToolPlaybookViolations({
      rootDir: resolve(__dirname, '../../../../src'),
    });
    expect(violations).toEqual([]);
  });
});
