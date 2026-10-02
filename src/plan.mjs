// SPDX-FileCopyrightText: 2026 Altifigence
// SPDX-License-Identifier: Apache-2.0
// Original process-boundary glue; no Verilator implementation or private DDS imports.
import { createHash } from 'node:crypto';

export const LIMITS = Object.freeze({ sources: 512, sourceBytes: 4 * 1024 * 1024, pathBytes: 256, defines: 128 });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const identifier = text => typeof text === 'string' && /^[A-Za-z_][A-Za-z0-9_$]{0,127}$/.test(text);
const fail = () => { throw new Error('Invalid Verilator lint plan inputs'); };
function exact(value, names) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype
      || Object.keys(value).sort().join('\0') !== [...names].sort().join('\0')) fail();
}
function relative(path) {
  return typeof path === 'string' && Buffer.byteLength(path) <= LIMITS.pathBytes
    && /^[A-Za-z0-9_][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9_][A-Za-z0-9_.-]*)*$/.test(path)
    && path.split('/').every(part => part !== '.' && part !== '..' && !part.endsWith('.')
      && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
}
function unique(list, maximum) {
  if (!Array.isArray(list) || list.length > maximum || new Set(list).size !== list.length) fail();
}

/** Build argv for a fixed external lint stage. Never spawn, read a path, or
 * choose a tool executable. The host must stage these exact UTF-8 source bytes
 * under its captured workspace and apply its existing execution authority. */
export function planVerilatorLint(input) {
  exact(input, ['schema', 'top', 'sources', 'roots', 'includeDirs', 'defines']);
  if (input.schema !== 'altifigence.verilator-lint-input.v1' || !identifier(input.top)) fail();
  if (!Array.isArray(input.sources) || input.sources.length < 1 || input.sources.length > LIMITS.sources) fail();
  let totalBytes = 0;
  const sources = input.sources.map(source => {
    exact(source, ['path', 'content', 'sha256']);
    if (!relative(source.path) || !/\.(?:v|sv|vh|svh)$/i.test(source.path)
        || typeof source.content !== 'string' || source.content.includes('\0')
        || typeof source.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(source.sha256)) fail();
    totalBytes += Buffer.byteLength(source.content, 'utf8');
    if (totalBytes > LIMITS.sourceBytes) fail();
    const bytes = Buffer.from(source.content, 'utf8');
    // Reject unpaired UTF-16 surrogates rather than hash replacement characters.
    if (bytes.toString('utf8') !== source.content || digest(bytes) !== source.sha256) fail();
    return Object.freeze({ path: source.path, sha256: source.sha256, byteLength: bytes.length });
  }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const paths = new Set(sources.map(source => source.path));
  const portablePaths = new Set(sources.map(source => source.path.toLowerCase()));
  if (portablePaths.size !== sources.length || totalBytes < 1 || totalBytes > LIMITS.sourceBytes) fail();
  for (const path of portablePaths) {
    for (let at = path.indexOf('/'); at >= 0; at = path.indexOf('/', at + 1)) {
      if (portablePaths.has(path.slice(0, at))) fail();
    }
  }
  unique(input.roots, LIMITS.sources); unique(input.includeDirs, LIMITS.sources);
  if (!input.roots.length || !input.roots.every(path => paths.has(path) && /\.(?:v|sv)$/i.test(path))) fail();
  if (!input.includeDirs.every(path => (path === '.' || relative(path)) && !portablePaths.has(path.toLowerCase()))) fail();
  if (!input.defines || Object.getPrototypeOf(input.defines) !== Object.prototype) fail();
  const defines = Object.entries(input.defines).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  if (defines.length > LIMITS.defines || !defines.every(([name, value]) => identifier(name)
      && (value === null || typeof value === 'string' && /^[A-Za-z0-9_.'+-]{1,256}$/.test(value)))) fail();
  const recipe = { schema: 'altifigence.verilator-lint-plan.v1', top: input.top,
    sources: Object.freeze(sources), totalBytes, roots: Object.freeze([...input.roots]), includeDirs: Object.freeze([...input.includeDirs]),
    defines: Object.freeze(Object.fromEntries(defines)),
    argv: Object.freeze(['--lint-only', '--language', '1800-2023', '--top-module', input.top,
      ...input.includeDirs.map(path => `-I${path}`),
      ...defines.map(([name, value]) => `-D${name}${value === null ? '' : `=${value}`}`), ...input.roots]),
    authority: 'argument-plan-only', executionAuthorized: false };
  return Object.freeze({ ...recipe, planSha256: digest(JSON.stringify(recipe)) });
}
