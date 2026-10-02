# Verilator adapter for Digital Design Studio

An original Apache-2.0 argument planner for an optional Verilator extension.
Version `0.1.0` is a source preview: it validates a saved SystemVerilog bundle
and builds a lint command plan. It does not install or run Verilator. DDS
Marketplace installation and supervised tool execution are not available in
this version. The package is marked `private: true` to prevent accidental npm
publication; its source is maintained at
[Altifigence/dds-verilator-plugin](https://github.com/Altifigence/dds-verilator-plugin).

Run `npm test` with Node 22. `planVerilatorLint()` checks the bounded saved-source
bundle hashes and constructs argv for a fixed external `--lint-only` stage.
The plan accepts portable relative `.v`, `.sv`, `.vh` and `.svh` source paths,
explicit compilation roots, include directories, defines and a top identifier.
It returns exact source identities, ordered arguments and a recipe digest.
It never reads files, spawns a process, downloads a tool or imports a DDS package.

The DDS host must translate this public plan into its existing captured-source
and supervised-stage contracts. It owns selected-root reads and staging, the
verified tool version/hash, licensing and Resource Governor admission,
cancellation, resource ceilings, diagnostics and output publication. This
candidate is not connected to the existing UVM simulator component. It supplies
neither UVM support nor a new execution permit. `v5.052` is a reviewed upstream
source reference, not an installed-version claim or a production version change.

The existing DDS Marketplace exposes VS Code and KLayout entries, with no
Verilator installation or execution entry. Its separate UVM/Verilator bridge is
still gated by an unavailable production trust root. This manifest uses a draft
schema that DDS does not consume. An executable extension requires real host
catalog/status/install/remove/cancel controls, approved immutable Windows/WSL
and Linux tool packages, complete binary/source license identities, captured
source staging and supervised diagnostics. Review a real lint run independently
from UVM acceptance and Marketplace publication. This package grants none of
those capabilities.

The public repository consists of exactly this directory. Its original
files use Apache-2.0. `licenses/LICENSE.Verilator` is the unchanged full upstream
license, retained separately; no Verilator implementation is copied here. The
manifest records the tag, peeled commit and full license byte identity. Before
any tool binary is offered, add an immutable source archive
digest, complete dependency inventory, notices, patch/build inputs and equivalent
source access beside that binary. An upstream URL and an open adapter repository
do not by themselves satisfy every binary distribution obligation.

The DDS built-in SystemVerilog analysis/synthesis/simulation and PX GDS parser,
writer and viewer continue through their native owners. Extending those engines
uses original implementation and explicit supported-subset tests. It does not
copy this external tool's internals or claim complete IEEE/UVM/EDA replacement.
