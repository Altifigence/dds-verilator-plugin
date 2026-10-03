// SPDX-FileCopyrightText: 2026 Altifigence
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { LIMITS, planVerilatorLint } from '../src/plan.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = (path, content) => ({ path, content, sha256: sha(content) });
const fixture = () => ({ schema: 'altifigence.verilator-lint-input.v1', top: 'top',
  sources: [source('rtl/top.sv', '`include "width.svh"\nmodule top; logic [`WIDTH-1:0] q; endmodule\n'),
    source('include/width.svh', '`define WIDTH 8\n')], roots: ['rtl/top.sv'], includeDirs: ['include'], defines: { TEST: null } });

test('independent planner captures exact source identities and preserves compilation order without executing', () => {
  const input = fixture();
  const plan = planVerilatorLint(input);
  assert.deepEqual(plan.argv, ['--lint-only', '--language', '1800-2023', '--top-module', 'top', '-Iinclude', '-DTEST', 'rtl/top.sv']);
  assert.equal(plan.executionAuthorized, false); assert.equal(plan.authority, 'argument-plan-only');
  assert.deepEqual(plan.sources.map(item => item.path), ['include/width.svh', 'rtl/top.sv']);
  const { planSha256, ...recipe } = plan; assert.equal(planSha256, sha(JSON.stringify(recipe)));
  input.sources.reverse(); assert.deepEqual(planVerilatorLint(input), plan, 'source inventory order is canonical');
  input.sources[0].content += '// changed';
  assert.throws(() => planVerilatorLint(input), /Invalid/);
  assert.throws(() => plan.argv.push('--exe'), TypeError);
  assert.throws(() => { plan.sources[0].sha256 = 'f'.repeat(64); }, TypeError);
  const ordered = fixture(); ordered.sources.push(source('rtl/pkg.sv', 'package pkg; endpackage\n'));
  ordered.roots = ['rtl/pkg.sv', 'rtl/top.sv'];
  const first = planVerilatorLint(ordered); ordered.roots.reverse();
  assert.notEqual(planVerilatorLint(ordered).planSha256, first.planSha256, 'compilation-unit order is semantic');
});

test('malformed and escaped inputs fail before an external argument plan exists', () => {
  const changes = [
    input => { input.top = 'top --exe'; },
    input => { input.top = '-top'; },
    input => { input.executable = '/usr/bin/verilator'; },
    input => { input.sources[0].path = '../outside.sv'; input.roots = ['../outside.sv']; },
    input => { input.sources[0].path = '/tmp/top.sv'; },
    input => { input.sources[0].path = 'C:/top.sv'; },
    input => { input.sources[0].path = '-f.sv'; },
    input => { input.sources[0].path = 'CON.sv'; },
    input => { input.sources[0].path = 'folder./top.sv'; },
    input => { input.sources.push(source('RTL/TOP.sv', 'module duplicate; endmodule')); },
    input => { input.sources.push(source('RTL/TOP.sv/child.sv', 'module child; endmodule')); },
    input => { input.sources[0].content += '\0'; },
    input => { input.sources[0].content += '\ud800'; },
    input => { input.sources[0].sha256 = '0'.repeat(64); },
    input => { input.sources.push(input.sources[0]); },
    input => { input.roots = ['missing.sv']; },
    input => { input.roots = ['include/width.svh']; },
    input => { input.includeDirs = ['include', 'include']; },
    input => { input.includeDirs = ['../include']; },
    input => { input.defines = { NAME: '\n--exe' }; },
    input => { input.defines = { '-F': 'args' }; },
    input => { input.sources = [source('huge.sv', 'x'.repeat(LIMITS.sourceBytes + 1))]; input.roots = ['huge.sv']; },
  ];
  for (const change of changes) { const input = fixture(); change(input); assert.throws(() => planVerilatorLint(input), /Invalid/); }
});

test('public source separates original adapter license from exact upstream terms and grants no host authority', () => {
  const manifest = JSON.parse(readFileSync(new URL('../extension.manifest.json', import.meta.url), 'utf8'));
  const license = readFileSync(new URL('../licenses/LICENSE.Verilator', import.meta.url));
  assert.equal(sha(license), manifest.tool.licenseSha256); assert.equal(license.length, manifest.tool.licenseBytes);
  assert.equal(manifest.tool.licenseFiles.length, 2);
  for (const entry of manifest.tool.licenseFiles) {
    const bytes = readFileSync(new URL(`../${entry.path}`, import.meta.url));
    assert.equal(sha(bytes), entry.sha256); assert.equal(bytes.length, entry.bytes);
    assert.equal(entry.url, `https://github.com/verilator/verilator/blob/${manifest.tool.commit}/${entry.upstreamPath}`);
  }
  const artistic = readFileSync(new URL('../licenses/Artistic-2.0.Verilator.txt', import.meta.url), 'utf8');
  assert.match(license.toString(), /GNU LESSER GENERAL PUBLIC LICENSE/);
  assert.match(license.toString(), /GNU GENERAL PUBLIC LICENSE/);
  assert.match(artistic, /Artistic License 2.0/);
  assert.equal(manifest.adapter.license, 'Apache-2.0'); assert.equal(manifest.tool.licenseExpression, 'LGPL-3.0-only OR Artistic-2.0');
  assert.equal(manifest.tool.bundled, false); assert.equal(manifest.tool.binary, null);
  assert.deepEqual(manifest.permissions, { execute: false, network: false, filesystem: false, hardware: false });
  assert.deepEqual(manifest.publication, { repository: 'https://github.com/Altifigence/dds-verilator-plugin', marketplace: null });
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.private, true); assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.version, manifest.version);
  assert.deepEqual(readdirSync(new URL('../src', import.meta.url)), ['plan.d.mts', 'plan.mjs']);
  assert.doesNotMatch(readFileSync(new URL('../src/plan.mjs', import.meta.url), 'utf8'), /from ['"]@altifigence-internal\/|child_process|\bfetch\(|\breadFile\(/);
});
