# Plan: in-app updates

**Status:** proposed, not implemented. This document exists so we can agree the
approach (and the trade-offs) before writing any code.

---

## The short answer

**It's not complicated — Tauri has a first-party updater plugin that does most
of this.** Realistically half a day's work, most of it one-time key setup rather
than code.

Your instinct about how it works is right: GitHub Actions builds and signs each
release, publishes a manifest, and the app checks that manifest on launch. The
signature check is the important part, and it's stronger than SHA verification
alone — more on that below.

---

## How it would work

```
   You                    GitHub Actions              GitHub Releases           The app
    │                           │                           │                     │
    │ git push v1.1.0           │                           │                     │
    ├──────────────────────────>│                           │                     │
    │                           │ build all platforms       │                     │
    │                           │ sign each bundle          │                     │
    │                           │ generate latest.json      │                     │
    │                           ├──────────────────────────>│                     │
    │                           │                           │                     │
    │                           │                           │  GET latest.json    │
    │                           │                           │<────────────────────┤
    │                           │                           │  "1.1.0 available"  │
    │                           │                           ├────────────────────>│
    │                           │                           │                     │
    │                           │                           │  download bundle    │
    │                           │                           ├────────────────────>│
    │                           │                           │   verify signature  │
    │                           │                           │   install, relaunch │
```

Concretely:

1. **You tag a release.** Exactly as now — `git tag v1.1.0 && git push origin v1.1.0`.
2. **CI signs each bundle.** `tauri-action` already supports this; it needs a
   signing key in repository secrets.
3. **CI publishes `latest.json`** alongside the installers — a small manifest
   listing the version, release notes, and a download URL plus signature per
   platform.
4. **The app checks on launch** (and on demand from a menu item), compares
   versions, and offers to update.
5. **On accept:** download, verify the signature, install, relaunch.

---

## On verification — signatures, not just SHAs

You asked about checking SHAs. Worth being precise here, because a hash alone
wouldn't actually protect you.

A SHA-256 proves the file **arrived intact**. It does not prove **who made it**.
If someone can tamper with the download, they can usually tamper with the
published hash too — so the check passes and you install their binary.

Tauri instead uses **minisign** (Ed25519) signatures:

- You generate a keypair once. The **private key lives only in GitHub Actions
  secrets**; the **public key is compiled into the app**.
- CI signs each bundle at build time.
- The app verifies that signature against its embedded public key before
  installing anything.

The practical difference: an attacker who fully compromised your GitHub account
and replaced every artefact and hash *still* couldn't produce an update your
installed apps would accept, because they wouldn't have the private key. Integrity
plus authenticity, rather than integrity alone. HTTPS already covers transport,
and the bundles' own SHAs are checked as part of the download.

---

## What's involved

### One-time setup (~30 min)

```sh
npm run tauri signer generate -- -w ~/.tauri/ghdocs.key
```

Produces a private key (**back this up somewhere safe — losing it means existing
installs can never be updated again**) and a public key.

- Private key + password → GitHub repository secrets
  (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`)
- Public key → `tauri.conf.json`

### Code changes (~2 hours)

| File | Change |
| --- | --- |
| `src-tauri/Cargo.toml` | Add `tauri-plugin-updater`, `tauri-plugin-process` |
| `src-tauri/src/lib.rs` | Register the plugins |
| `src-tauri/tauri.conf.json` | `createUpdaterArtifacts: true`, endpoint URL, public key |
| `capabilities/default.json` | Grant `updater:default`, `process:allow-restart` |
| `.github/workflows/release.yml` | Pass the signing secrets |
| `src/app.js` + `index.html` | Check on launch; "Update available" prompt with notes |

### Then

Test by tagging `v1.0.1` and confirming your installed `v1.0.0` offers it.

---

## Trade-offs worth deciding on

**Silent or prompted?** I'd suggest checking quietly on launch and showing an
unobtrusive banner rather than a modal — it's a lookup tool you open to find
something quickly, and a dialog in the way of that is irritating. Plus a manual
**Check for updates** menu item.

**Key management is the real commitment.** Lose the private key and you cannot
ship updates to existing installs ever again — everyone must manually reinstall.
It needs a real backup, not just a file in your home directory.

**Gatekeeper stays unchanged.** The updater doesn't remove the "unidentified
developer" prompt on first install, since that needs a paid Apple Developer
certificate (~£79/year). It *does* mean users only face that prompt once, rather
than on every manual reinstall.

**Windows and Linux come free.** The same plugin handles all platforms, so no
extra work there.

**Does it earn its keep?** If this stays a personal tool, `./scripts/update.sh`
already does the job in one command and costs nothing to maintain. The updater
matters most if other people use it, or if you use it on several machines.

---

## Suggested sequencing

1. **Now:** `scripts/update.sh` covers the one-machine case. *(Done.)*
2. **When it's worth it:** add the updater, roughly in this order —
   generate and back up keys → wire up CI signing → add the plugin → build the
   UI → test with a throwaway `v1.0.1`.
3. **Later, optional:** Apple Developer certificate for signing and notarisation,
   which removes the Gatekeeper prompt entirely.

---

## To decide

- Add the updater now, or leave it until the script stops being enough?
- Silent check with a banner, or an explicit prompt?
- Somewhere safe lined up to back up the private key?
