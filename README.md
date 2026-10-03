# Verilator adapter for Digital Design Studio

[Official integration guide](https://docs.altifigence.com/products/digital-design-studio/plugins/) · [한국어](https://docs.altifigence.com/ko-kr/products/digital-design-studio/plugins/) · [Build a DDS plugin](https://docs.altifigence.com/developers/plugin-sdk/) · [Releases](https://github.com/Altifigence/dds-verilator-plugin/releases)

An Apache-2.0, dependency-free JavaScript adapter that verifies saved
SystemVerilog source identities and builds a Verilator `--lint-only` argument
plan. Release **0.1.1** includes the implementation, TypeScript declarations,
tests and a runnable example. The planner does not parse HDL or run Verilator.

The DDS Marketplace's `0.1.0` Verilator integration is a **source preview** with
installation and execution disabled. This repository's `0.1.1` source release
supplies its lint planner; it does not update that host integration. For the
general plugin API and a runnable plugin project, use the
official [DDS Plugin SDK](https://github.com/Altifigence/dds-plugin-sdk).

## Run the example

Use Node.js 22 or 24. No package installation or Verilator binary is required.

```sh
git clone https://github.com/Altifigence/dds-verilator-plugin.git
cd dds-verilator-plugin
npm test
npm run example
npm run test:package
```

[`examples/lint-plan.mjs`](examples/lint-plan.mjs) reads the included saved
`rtl/adder.sv` and `include/config.svh`, hashes their exact UTF-8 bytes and prints
a JSON plan. Its arguments are:

```text
--lint-only --language 1800-2023 --top-module adder -Iinclude -DEXAMPLE rtl/adder.sv
```

The example reads only its fixed fixture files. The exported planner itself
performs no filesystem, network or process operations.

## Use the package

```sh
npm pack
npm install ./altifigence-verilator-plan-adapter-0.1.1.tgz
```

```js
import { planVerilatorLint } from '@altifigence/verilator-plan-adapter';

const plan = planVerilatorLint(savedBundle);
console.log(plan.argv, plan.planSha256);
```

See the [API reference](docs/API.md) for the complete input and return shapes.
The package is `private: true` to prevent accidental npm registry publication;
the GitHub source and local npm tarball are usable without private DDS packages.

## Host integration

A host must retain and stage the exact captured source bytes, verify the tool
identity and apply its own execution authorization, resource limits,
cancellation and diagnostics. `executionAuthorized` is always `false`; a plan
digest is an input identity, not an execution permit. The included draft
manifest is descriptive metadata and is not an installable DDS extension.

The separate DDS UVM/Verilator bridge remains gated by its production trust
root. This release supplies no simulator or UVM execution capability.

## Licenses

Original adapter files use [Apache-2.0](LICENSE). Verilator source and binaries
are not bundled. The pinned upstream reference is `v5.052`, commit
`ea338be98e1e838d3518809ce8899f85a009963c`; it is not an installed-version claim.

Verilator declares `LGPL-3.0-only OR Artistic-2.0`. The exact upstream
[`LICENSE`](https://github.com/verilator/verilator/blob/ea338be98e1e838d3518809ce8899f85a009963c/LICENSE)
contains the LGPL/GPL texts and is copied to
[`licenses/LICENSE.Verilator`](licenses/LICENSE.Verilator). The separate
[`LICENSES/Artistic-2.0.txt`](https://github.com/verilator/verilator/blob/ea338be98e1e838d3518809ce8899f85a009963c/LICENSES/Artistic-2.0.txt)
is copied to [`licenses/Artistic-2.0.Verilator.txt`](licenses/Artistic-2.0.Verilator.txt).
Their exact byte counts and SHA-256 identities are in the manifest; see [NOTICE](NOTICE).

For changes or vulnerability reports, see [CONTRIBUTING](CONTRIBUTING.md) and
[SECURITY](SECURITY.md).
