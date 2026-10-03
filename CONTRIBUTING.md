# Contributing

Use Node.js 22 or 24, clone this repository and run:

```sh
npm test
npm run example
npm run test:package
```

There are no runtime or development dependencies. Public CI runs these checks
on GitHub-hosted runners for both Node versions. Open a pull request with the
behavior you changed and relevant validation. For validation changes, add a
small input fixture showing acceptance or rejection.

Keep `planVerilatorLint()` independent of private DDS packages and host I/O.
Preserve saved-byte validation, argument ordering and the explicit host
authorization boundary. This repository does not own tool installation or the
DDS UVM runtime. Contributions use Apache-2.0; retain original SPDX notices.
Do not edit copied upstream license text. Vulnerabilities belong in the private
reporting path described in [SECURITY](SECURITY.md).
