import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { env } from '~/config/env';

import type { BehaviorFixture } from './types/behavior-fixture';
import { runChatCompletion } from './utils/run-chat-completion';

const describeOrSkip = env.LLM_BEHAVIOR_ENABLED ? describe : describe.skip;

const loadFixture = (name: string): BehaviorFixture =>
  JSON.parse(
    readFileSync(join(__dirname, 'fixtures', `${name}.json`), 'utf-8'),
  ) as BehaviorFixture;

const fixtures = ['get-tool-help-new-tool', 'get-tool-help-already-used'];

describeOrSkip('get_tool_help behavior against real LLM', () => {
  jest.setTimeout(30_000);

  it.each(fixtures)('%s: model calls the expected first tool', async (name) => {
    const fixture = loadFixture(name);
    const observed = await runChatCompletion(fixture);

    expect(observed).not.toBeNull();
    expect(observed?.name).toBe(fixture.expected.firstToolCall.name);
    for (const [key, value] of Object.entries(
      fixture.expected.firstToolCall.argsMatch,
    )) {
      expect(String(observed?.arguments[key]).toLowerCase()).toContain(
        String(value).toLowerCase(),
      );
    }
  });
});

describe('get_tool_help behavior fixtures', () => {
  it.each(fixtures)('%s fixture is well-formed', (name) => {
    const fixture = loadFixture(name);
    expect(fixture.scenario).toBeTruthy();
    expect(fixture.treatmentStyle).toBeTruthy();
    expect(fixture.conversation.length).toBeGreaterThan(0);
    expect(fixture.tools.length).toBeGreaterThan(0);
    expect(fixture.expected.firstToolCall.name).toBeTruthy();
  });
});
