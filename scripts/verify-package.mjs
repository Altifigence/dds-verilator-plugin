// SPDX-FileCopyrightText: 2026 Altifigence
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Use npm's own CLI through Node so Windows needs no shell argument interpolation.
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run this check with npm run test:package');
const root = fileURLToPath(new URL('../', import.meta.url));
const temporaryRoot = realpathSync(tmpdir());
const scratch = realpathSync(mkdtempSync(join(temporaryRoot, 'dds-verilator-package-')));
const npm = (args, cwd) => execFileSync(process.execPath, [npmCli, ...args], {
  cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  const [packed] = JSON.parse(npm(['pack', '--ignore-scripts', '--json', '--pack-destination', scratch], root));
  assert.equal(packed.filename, 'altifigence-verilator-plan-adapter-0.1.1.tgz');
  const archive = join(scratch, packed.filename);
  const consumer = join(scratch, 'consumer');
  mkdirSync(consumer);
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  npm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', archive], consumer);
  const installed = join(consumer, 'node_modules', '@altifigence', 'verilator-plan-adapter');
  const metadata = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
  assert.equal(metadata.version, '0.1.1');
  assert.equal(metadata.dependencies, undefined);
  assert.ok(readFileSync(join(installed, metadata.types), 'utf8').includes('VerilatorLintPlan'));
  const manifest = JSON.parse(readFileSync(join(installed, 'extension.manifest.json'), 'utf8'));
  for (const license of manifest.tool.licenseFiles) {
    const bytes = readFileSync(join(installed, license.path));
    assert.equal(bytes.length, license.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), license.sha256);
  }
  for (const path of ['docs/API.md', 'CONTRIBUTING.md', 'SECURITY.md']) readFileSync(join(installed, path));
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { createHash } from 'node:crypto';
    import { LIMITS, planVerilatorLint } from '@altifigence/verilator-plan-adapter';
    const content = 'module external; endmodule\\n';
    const input = { schema: 'altifigence.verilator-lint-input.v1', top: 'external',
      sources: [{ path: 'rtl/external.sv', content, sha256: createHash('sha256').update(content).digest('hex') }],
      roots: ['rtl/external.sv'], includeDirs: [], defines: {} };
    const plan = planVerilatorLint(input);
    assert.equal(LIMITS.sourceBytes, 4194304);
    assert.deepEqual(plan.argv, ['--lint-only', '--language', '1800-2023', '--top-module', 'external', 'rtl/external.sv']);
    assert.equal(plan.executionAuthorized, false);
    assert.ok(Object.isFrozen(plan));
    input.sources[0].content += '// changed';
    assert.throws(() => planVerilatorLint(input), /Invalid/);
  `], { cwd: consumer, stdio: 'pipe' });
  const example = JSON.parse(execFileSync(process.execPath, [join(installed, 'examples', 'lint-plan.mjs')], {
    cwd: consumer, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }));
  assert.deepEqual(example.argv, ['--lint-only', '--language', '1800-2023', '--top-module', 'adder', '-Iinclude', '-DEXAMPLE', 'rtl/adder.sv']);
  assert.equal(example.sources.length, 2);
  assert.equal(example.executionAuthorized, false);
  console.log(JSON.stringify({
    archive: packed.filename, bytes: packed.size, files: packed.files.length,
    sha256: createHash('sha256').update(readFileSync(archive)).digest('hex'),
    consumer: 'offline install, public import, saved-byte rejection, licenses and bundled example passed',
  }, null, 2));
} finally {
  const cleanupTarget = realpathSync(scratch);
  assert.equal(cleanupTarget, scratch);
  assert.equal(dirname(cleanupTarget), temporaryRoot);
  assert.ok(basename(cleanupTarget).startsWith('dds-verilator-package-'));
  rmSync(cleanupTarget, { recursive: true });
}
