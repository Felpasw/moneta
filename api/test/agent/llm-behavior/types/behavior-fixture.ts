import type { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';

export interface BehaviorFixture {
  readonly scenario: string;
  readonly description: string;
  readonly treatmentStyle: TreatmentStyle;
  readonly conversation: ReadonlyArray<Record<string, unknown>>;
  readonly tools: ReadonlyArray<Record<string, unknown>>;
  readonly expected: {
    readonly firstToolCall: {
      readonly name: string;
      readonly argsMatch: Record<string, unknown>;
    };
  };
}
