# Deployment

How to build this app for the first time, how to update your installed copy when
changes land, and how releases are produced.

- [First-time build](#first-time-build)
- [Updating your installed copy](#updating-your-installed-copy)
- [Publishing a release](#publishing-a-release)
- [Troubleshooting](#troubleshooting)

---

## First-time build

### 1. Install the prerequisites

| Tool | Why | Install |
| --- | --- | --- |
| **Xcode Command Line Tools** | Apple's linker and SDK headers | `xcode-select --install` |
| **Rust** | Compiles the app backend | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **Node.js 18+** | Runs the Tauri CLI only | [nodejs.org](https://nodejs.org) or `brew install node` |

After installing Rust, either restart your terminal or run:

```sh
source "$HOME/.cargo/env"
```

Verify everything is present:

```sh
rustc --version   # 1.77 or newer
node --version    # v18 or newer
xcode-select -p   # prints a path
```

### 2. Get the code

```sh
git clone https://github.com/DamienButler/github-documentation-manager.git
cd github-documentation-manager
npm install
```

### 3. Run it in development

```sh
npm run dev
```

The first build takes **two to five minutes** while Rust compiles roughly 350
dependencies. Later builds take seconds because the results are cached in
`src-tauri/target/`.

This mode reloads automatically when you edit files in `src/`, and prints
errors to the terminal. Use it while making changes.

### 4. Build the real app

```sh
npm run build
```

This produces an optimised, self-contained bundle in about a minute:

```
src-tauri/target/release/bundle/
├── macos/Docu Manage.app     ← the app itself
└── dmg/Docu Manage_1.0.0_aarch64.dmg
```

### 5. Install it

```sh
cp -R "src-tauri/target/release/bundle/macos/Docu Manage.app" /Applications/
```

Then open it from Spotlight (`⌘Space`), Launchpad, or the Applications folder.

> **If macOS blocks it:** the build is signed ad-hoc rather than with a paid
> Apple Developer certificate, so Gatekeeper may refuse the first launch.
> Right-click the app → **Open** → **Open**. You only need to do this once.
>
> Because you built it yourself, you can also clear the flag directly:
>
> ```sh
> xattr -dr com.apple.quarantine "/Applications/Docu Manage.app"
> ```

### Don't want to build it?

Download the `.dmg` for your platform from the
[Releases page](https://github.com/DamienButler/github-documentation-manager/releases),
open it, and drag the app to Applications. Same Gatekeeper note applies.

---

## Updating your installed copy

There is currently **no in-app updater** — see [UPDATER.md](UPDATER.md) for the
plan to add one. Until then, updating is three commands.

### If you build from source

```sh
cd /path/to/github-documentation-manager
git pull
npm install    # only needed if package.json changed
npm run build
cp -R "src-tauri/target/release/bundle/macos/Docu Manage.app" /Applications/
```

Quit the app before the final `cp`, or macOS may refuse to overwrite a running
bundle. If you hit `Operation not permitted`, quit and retry.

For convenience, this repo includes a script that does all of the above:

```sh
./scripts/update.sh
```

### If you installed from a release

Download the newer `.dmg` from the
[Releases page](https://github.com/DamienButler/github-documentation-manager/releases),
open it, and drag the app to Applications, replacing the existing copy.

### Your data is never affected

The library lives outside the application bundle:

```
~/Library/Application Support/com.damienbutler.documanage/library.json
```

Replacing, reinstalling or deleting the app does not touch it. The **Data**
button in the app header shows the exact path.

To be extra safe before a big change, use **Export** (`⌘S`) to write a copy
somewhere you control.

---

## Publishing a release

*(For the maintainer.)*

Releases are built by GitHub Actions and triggered by pushing a version tag.

### 1. Make sure `main` is green

```sh
gh run list --branch main --limit 3
```

CI, CodeQL and Security audit should all show `success`.

### 2. Bump the version

The version appears in two files and **must match**:

- `package.json` → `"version"`
- `src-tauri/Cargo.toml` → `version`

```sh
# Example: 1.0.0 → 1.1.0
sed -i '' 's/"version": "1.0.0"/"version": "1.1.0"/' package.json
sed -i '' 's/^version = "1.0.0"/version = "1.1.0"/' src-tauri/Cargo.toml

git commit -am "Release v1.1.0"
git push origin main
```

### 3. Tag it

```sh
git tag -a v1.1.0 -m "v1.1.0"
git push origin v1.1.0
```

### 4. Wait for the build

The [Release workflow](.github/workflows/release.yml) builds four targets in
parallel — macOS Apple Silicon, macOS Intel, Windows and Linux — in roughly
**eight minutes**.

```sh
gh run watch
```

### 5. Review and publish

The workflow creates a **draft** release so nothing goes public unreviewed.

```sh
gh release view v1.1.0                      # check the assets
gh release edit v1.1.0 --draft=false --latest   # publish
```

Expected assets:

| Platform | Files |
| --- | --- |
| macOS | `_aarch64.dmg`, `_x64.dmg`, `.app.tar.gz` |
| Windows | `_x64-setup.exe`, `_x64_en-US.msi` |
| Linux | `_amd64.deb`, `.x86_64.rpm`, `_amd64.AppImage` |

### If a release build fails

Fix the problem on `main`, then move the tag:

```sh
git tag -d v1.1.0
git push --delete origin v1.1.0
git tag -a v1.1.0 -m "v1.1.0"
git push origin v1.1.0
```

Only do this for tags that were never published. Once people have downloaded a
release, cut a new version instead of moving the tag under them.

---

## Troubleshooting

**`cargo: command not found`**
Rust isn't on your `PATH` for this shell. Run `source "$HOME/.cargo/env"`, or
restart the terminal.

**First build seems to hang**
It isn't — Rust is compiling ~350 crates. Two to five minutes is normal on a
first run. Subsequent builds reuse the cache.

**`failed to bundle project: error running bundle_dmg.sh`**
The `.app` built fine; only the DMG step failed. `bundle_dmg.sh` asks Finder,
via AppleScript, to lay out the disk image window, and macOS blocks that unless
your terminal has Automation permission.

- To just use the app, ignore it — copy the `.app` from
  `src-tauri/target/release/bundle/macos/` as shown above.
- To fix it, grant your terminal access under **System Settings → Privacy &
  Security → Automation → [your terminal] → Finder**.

CI is unaffected, so released DMGs still build correctly.

**`Operation not permitted` when copying to /Applications**
The app is running. Quit it and retry.

**Gatekeeper: "cannot be opened because the developer cannot be verified"**
Expected for unsigned builds. Right-click → **Open** → **Open**, or run
`xattr -dr com.apple.quarantine "/Applications/Docu Manage.app"`.

**Build succeeds but the app shows a blank window**
Usually a JavaScript error. Run `npm run dev` and check the terminal, or
right-click in the app → **Inspect Element** for the console.
