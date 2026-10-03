# Security

Security fixes target the latest `0.1.x` source release. This preview verifies
bounded saved inputs and prepares arguments; it supplies no tool execution,
filesystem authority, network access or installation capability. A consuming
host must independently stage sources and enforce its execution policy.

Report path escape, source identity mismatch, argument injection or authority
bypass privately through the repository's
[Security tab](https://github.com/Altifigence/dds-verilator-plugin/security).
If private vulnerability reporting is unavailable, open an issue requesting a
private reporting channel without including exploit details.

Include the adapter version, Node version, a minimal saved-input reproduction,
expected behavior and observed behavior. Omit credentials and private HDL.
Verilator implementation issues should be reported to
[Verilator upstream](https://github.com/verilator/verilator/security).
