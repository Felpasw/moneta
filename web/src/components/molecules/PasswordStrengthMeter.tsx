"use client";

import { useState } from "react";

import { Input } from "@/components/atoms/Input";
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/components/atoms/Meter";

enum StrengthLevel {
  EMPTY = "empty",
  WEAK = "weak",
  FAIR = "fair",
  GOOD = "good",
  STRONG = "strong",
  VERY_STRONG = "very_strong",
}

interface StrengthDescriptor {
  color: string;
  label: string;
  value: number;
}

const STRENGTH_DESCRIPTORS: Record<StrengthLevel, StrengthDescriptor> = {
  [StrengthLevel.EMPTY]: { color: "", label: "", value: 0 },
  [StrengthLevel.WEAK]: { color: "bg-destructive", label: "Weak", value: 20 },
  [StrengthLevel.FAIR]: { color: "bg-orange-500", label: "Fair", value: 40 },
  [StrengthLevel.GOOD]: { color: "bg-yellow-500", label: "Good", value: 60 },
  [StrengthLevel.STRONG]: { color: "bg-blue-500", label: "Strong", value: 80 },
  [StrengthLevel.VERY_STRONG]: {
    color: "bg-green-500",
    label: "Very strong",
    value: 100,
  },
};

const SCORE_CHECKS: Array<(password: string) => boolean> = [
  (password) => password.length >= 8,
  (password) => password.length >= 12,
  (password) => /[A-Z]/.test(password),
  (password) => /[0-9]/.test(password),
  (password) => /[^A-Za-z0-9]/.test(password),
];

const SCORE_THRESHOLDS: Array<{ maxScore: number; level: StrengthLevel }> = [
  { maxScore: 1, level: StrengthLevel.WEAK },
  { maxScore: 2, level: StrengthLevel.FAIR },
  { maxScore: 3, level: StrengthLevel.GOOD },
  { maxScore: 4, level: StrengthLevel.STRONG },
  { maxScore: Number.POSITIVE_INFINITY, level: StrengthLevel.VERY_STRONG },
];

const scorePassword = (password: string): number =>
  SCORE_CHECKS.reduce(
    (total, check) => total + (check(password) ? 1 : 0),
    0,
  );

const resolveLevel = (password: string): StrengthLevel => {
  if (password.length === 0) return StrengthLevel.EMPTY;

  const score = scorePassword(password);
  const threshold = SCORE_THRESHOLDS.find((entry) => score <= entry.maxScore);

  return threshold?.level ?? StrengthLevel.VERY_STRONG;
};

export default function PasswordStrengthMeter() {
  const [password, setPassword] = useState("");
  const strength = STRENGTH_DESCRIPTORS[resolveLevel(password)];

  return (
    <div className="w-full max-w-sm space-y-3">
      <Input
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter a password"
        type="password"
        value={password}
      />
      <Meter value={strength.value}>
        <div className="flex items-center justify-between gap-2">
          <MeterLabel>Password strength</MeterLabel>
          {strength.label ? <MeterValue>{() => strength.label}</MeterValue> : null}
        </div>
        <MeterTrack>
          <MeterIndicator className={strength.color} />
        </MeterTrack>
      </Meter>
    </div>
  );
}
