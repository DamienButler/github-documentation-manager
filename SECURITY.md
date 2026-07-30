# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Use GitHub's private reporting instead: go to the **Security** tab →
**Report a vulnerability**. That opens a private advisory visible only to the
maintainers.

Please include what you found, how to reproduce it, and what an attacker could
achieve. You can expect an initial response within a few days.

## Supported versions

The most recent release is supported. Fixes are issued as new releases rather
than backported.

## Design notes relevant to security

This is a local, single-user desktop application. It has no server, no accounts
and no telemetry, so the attack surface is mostly "what happens when the app
loads a URL you saved".

- **Deny-by-default permissions.** Tauri grants the frontend nothing unless it
  is listed in `src-tauri/capabilities/default.json`. The app requests only
  file dialogs, opening external URLs, and control of the viewer webview. There
  is no blanket filesystem or network access.
- **URL validation in Rust.** Anything handed to the document viewer is parsed
  and rejected unless the scheme is `http` or `https`, so a crafted library
  file cannot make the app open `file://`, `javascript:` or similar.
- **Untrusted content is isolated.** Documentation pages render in a separate
  child webview with no access to the application's own JavaScript context or
  to Tauri commands.
- **Find-in-page runs inside the page, not across the boundary.** Searching the
  document you are reading is implemented by a self-contained script injected
  into the viewer. It reports nothing back to the app. The alternative —
  querying the page and returning match counts — would mean exposing Tauri's
  internal messaging to every site you visit, which is a far larger boundary to
  defend for a smaller benefit. The same reasoning is why **＋ Add page**
  derives its suggested title from the URL rather than reading the page's
  `<title>`.
- **HTML escaping.** Every value from the library — titles, URLs, tags, notes —
  is escaped before it reaches the DOM, so importing a malicious library cannot
  inject script into the app's own UI.
- **Atomic writes.** The library is written to a temporary file and renamed
  over the original, so an interrupted save cannot corrupt your data.

## Automated checks

Every push and pull request runs:

| Check | What it covers |
| --- | --- |
| **CodeQL** | Static analysis of the JavaScript and Rust for security flaws, using the `security-extended` query set |
| **cargo audit** | Rust dependencies against the [RustSec](https://rustsec.org) advisory database |
| **cargo deny** | Advisories, licence compliance, banned crates and unexpected registries |
| **npm audit** | Build-time JavaScript tooling |
| **Dependency review** | Flags vulnerable or badly-licensed dependencies introduced by a pull request |
| **zizmor** | Audits the CI workflows themselves for injection and over-broad permissions |

CodeQL and the dependency audits also run weekly, so advisories published after
a commit was merged are still caught. Dependabot opens pull requests for
outdated Rust, npm and Actions dependencies.

### Known accepted findings

**`glib` unsoundness — RUSTSEC-2024-0429 (moderate).** `glib` 0.18.x contains
unsound `Iterator`/`DoubleEndedIterator` implementations for `VariantStrIter`.
It reaches us only through Tauri's GTK-based **Linux** backend:

- It is **absent from the macOS and Windows dependency trees** entirely
  (`cargo tree -i glib --target aarch64-apple-darwin` returns nothing), so the
  macOS and Windows builds do not contain the affected code.
- It **cannot be updated independently**: Tauri pins `gtk` 0.18, which pins
  `glib` 0.18. The fix landed in `glib` 0.20 and will reach us when Tauri
  migrates the gtk-rs stack.
- The issue is *unsoundness* rather than a directly exploitable vulnerability;
  triggering it requires specific misuse of the iterator by calling code.

This affects only the Linux AppImage. It is recorded in `deny.toml` with the
same reasoning. Reviewed 2026-07-28.

`cargo audit` additionally reports a number of **unmaintained** GTK/GLib crates
from the same Linux backend, for the same reasons.
