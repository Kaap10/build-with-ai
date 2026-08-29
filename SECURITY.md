# Security Policy

## Supported Versions

The table below indicates the versions of `build-with-ai` currently receiving security updates:

| Version | Supported          |
| :------ | :----------------- |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Security Philosophy

`build-with-ai` is designed from the ground up with a privacy-first, zero-telemetry architecture:

- **Zero Network API Calls:** The CLI never sends your code, ideas, or decisions over the internet.
- **Local Storage Only:** All workflow metadata is kept inside your local `.buildwithai/` folder.
- **Non-Destructive:** The CLI never deletes or overwrites user application source code.
- **No Credentials Required:** No API keys or account secrets are ever requested or stored.

---

## Reporting a Vulnerability

If you discover a security vulnerability in `build-with-ai`, please do **not** open a public GitHub issue.

Instead, please report the vulnerability privately by:

1. Opening a private security advisory on GitHub under the **Security** tab of the repository (`https://github.com/Kaap10/build-with-ai/security/advisories/new`).
2. Providing a detailed description of the vulnerability, steps to reproduce, and potential impact.

### What to Expect

- **Acknowledgment:** You will receive an acknowledgment of your report within 48 hours.
- **Assessment:** We will assess the vulnerability and develop a patch.
- **Release & Credit:** A patched release will be published to npm, and you will be credited in the release notes (unless you prefer to remain anonymous).
