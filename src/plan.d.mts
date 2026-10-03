// SPDX-FileCopyrightText: 2026 Altifigence
// SPDX-License-Identifier: Apache-2.0
export interface SavedSource {
  readonly path: string;
  readonly content: string;
  readonly sha256: string;
}

export interface VerilatorLintInput {
  readonly schema: 'altifigence.verilator-lint-input.v1';
  readonly top: string;
  readonly sources: readonly SavedSource[];
  readonly roots: readonly string[];
  readonly includeDirs: readonly string[];
  readonly defines: Readonly<Record<string, string | null>>;
}

export interface VerilatorLintPlan {
  readonly schema: 'altifigence.verilator-lint-plan.v1';
  readonly top: string;
  readonly sources: readonly Readonly<{ path: string; sha256: string; byteLength: number }>[];
  readonly totalBytes: number;
  readonly roots: readonly string[];
  readonly includeDirs: readonly string[];
  readonly defines: Readonly<Record<string, string | null>>;
  readonly argv: readonly string[];
  readonly authority: 'argument-plan-only';
  readonly executionAuthorized: false;
  readonly planSha256: string;
}

export const LIMITS: Readonly<{ sources: 512; sourceBytes: 4194304; pathBytes: 256; defines: 128 }>;
export function planVerilatorLint(input: VerilatorLintInput): VerilatorLintPlan;
