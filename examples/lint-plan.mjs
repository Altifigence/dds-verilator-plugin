// SPDX-FileCopyrightText: 2026 Altifigence
// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { planVerilatorLint } from '@altifigence/verilator-plan-adapter';

// Read only the two fixed saved fixtures; the planner never reads or stages files.
const sources = ['rtl/adder.sv', 'include/config.svh'].map(path => {
  const bytes = readFileSync(new URL(path, import.meta.url));
  const content = bytes.toString('utf8');
  if (!Buffer.from(content, 'utf8').equals(bytes)) throw new Error(`Invalid UTF-8 fixture: ${path}`);
  return { path, content, sha256: createHash('sha256').update(bytes).digest('hex') };
});

const plan = planVerilatorLint({
  schema: 'altifigence.verilator-lint-input.v1',
  top: 'adder', sources, roots: ['rtl/adder.sv'], includeDirs: ['include'], defines: { EXAMPLE: null },
});
console.log(JSON.stringify(plan, null, 2));
