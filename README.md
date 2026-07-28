# GitHub Documentation Manager

A small, fast desktop app for collecting, categorising and looking up documentation links — GitHub's docs, RFCs, internal wikis, anything with a URL. Pages render **inside** the app, so you don't lose your place hopping between browser tabs.

Built with [Tauri](https://tauri.app) — a Rust shell around the operating system's own webview. The whole app is a few megabytes, with no bundled Chromium.

---

## Contents

- [Why](#why)
- [Install](#install)
- [Using the app](#using-the-app)
  - [Adding a link](#adding-a-link)
  - [Searching](#searching)
  - [Reading a document](#reading-a-document)
  - [Copying a URL](#copying-a-url)
  - [Keyboard shortcuts](#keyboard-shortcuts)
- [Where your data lives](#where-your-data-lives)
- [Backups, sync and sharing](#backups-sync-and-sharing)
- [Building from source](#building-from-source)
- [Project layout](#project-layout)
- [Security](#security)
- [Licence](#licence)

---

## Why

Documentation lookup is a workflow with a specific shape: you know roughly *what* you need, you want it in two seconds, and you want it organised the way **you** think about it — not the way the vendor's navigation happens to be structured.

Browser bookmarks are a flat, unsearchable mess. This app gives you a two-level **Category → Sub category** tree, full-text search across everything you've saved, your own notes on each entry, and inline rendering so the doc opens right beside the list.

---

## Install

### From a release

Download the `.dmg` from the [Releases](../../releases) page, open it, and drag the app to Applications.

> **First launch on macOS:** the app isn't signed with a paid Apple Developer certificate, so Gatekeeper will refuse it the first time. Right-click the app → **Open** → **Open**. You only need to do this once. If you'd rather not trust an unsigned binary, [build it from source](#building-from-source) — it takes about a minute.

### From source

See [Building from source](#building-from-source).

---

## Using the app

The window is split into two panes:

```
┌─────────────────────────┬──────────────────────────────────────┐
│  [Documentation] [Add]  │  Title                    [actions]  │
│  ┌───────────────────┐  │  Category › Sub category             │
│  │ Search…           │  │  URL  https://…            [Copy]    │
│  └───────────────────┘  │  #tags                               │
│                         │  Notes…                              │
│  ▼ GITHUB ACTIONS   2   ├──────────────────────────────────────┤
│    ▼ Workflow syntax 1  │  ⟳  https://docs.github.com/…     ↗  │
│      Workflow syntax…   ├──────────────────────────────────────┤
│    ▼ Reusable wf…    1  │                                      │
│      Reusing workflows  │      (the live document renders      │
│  ▼ REST API         1   │       here, in a real webview)       │
│    ▼ Repositories    1  │                                      │
│      REST API — Repos   │                                      │
└─────────────────────────┴──────────────────────────────────────┘
```

### Adding a link

1. Click the **Add link** tab (or press `⌘N`).
2. Fill in:
   - **Title** — how it appears in the tree. Write it the way you'd search for it.
   - **URL** — paste it in. If you leave off `https://`, it's added for you.
   - **Category** — pick an existing one, or choose **＋ New category…** and type a name.
   - **Sub category** — same, with **＋ New sub category…**. Picking a new category automatically switches this to "new" too, since a brand-new category has no sub categories yet.
   - **Tags** *(optional)* — comma separated, e.g. `actions, ci, yaml`. These are searchable.
   - **Notes** *(optional)* — why this link is useful, the one flag you always forget, etc.
3. Click **Save link**.

The new entry appears in the tree immediately and is selected in the right pane. Categories and sub categories are created on the fly — there's no separate "manage categories" screen to visit first.

**Example.** Say you keep hitting the same `actions/cache` gotcha:

| Field | Value |
| --- | --- |
| Title | `actions/cache — key vs restore-keys` |
| URL | `https://github.com/actions/cache#skipping-steps-based-on-cache-hit` |
| Category | `GitHub Actions` |
| Sub category | *＋ New sub category…* → `Caching` |
| Tags | `cache, ci, performance` |
| Notes | `restore-keys is a prefix match, evaluated in order. Cache is immutable once written for a key.` |

### Searching

The search box sits at the top of the left pane. Press `⌘F` (or just `/`) to jump to it from anywhere.

Search matches across **titles, URLs, tags, category names, sub category names and notes**, so any of these find the entry above:

| You type | Why it matches |
| --- | --- |
| `cache` | title, tag and sub category |
| `restore-keys` | it's in the notes |
| `actions/cache` | it's in the URL |
| `caching` | sub category name |

Multiple words are **AND**-ed and matched in any order — `cache ci` finds entries containing both, wherever they appear. Search is case-insensitive.

While you're searching, every matching branch is expanded automatically and non-matching categories are hidden entirely, so results are always visible. Clear the box to return to your normal tree.

### Reading a document

Click any entry in the left pane. The right pane shows:

- **Title** and the **Category › Sub category** breadcrumb
- The full **URL**, clickable, with a **Copy** button
- **Tags** and your **Notes**
- The **live document**, rendered below

The document is displayed in a real native webview positioned over the pane — not an `<iframe>`. That distinction matters: sites which send `X-Frame-Options` or a `frame-ancestors` policy (github.com and docs.github.com among them) refuse to load in an iframe, but render perfectly here. Links inside the document work; you can browse from the page you saved.

Above the document: **⟳** reloads it, **↗** opens the page in your normal browser.

**Editing notes.** Click **Edit notes**, type, then click away — it saves on blur. Good for accumulating the specific details you keep re-looking-up.

### Copying a URL

Two ways:

- **From the tree** — hover any entry and click **Copy URL** on the right of the row. You never have to open the doc to grab its link.
- **From the detail pane** — the **Copy** button beside the URL.

Either way you get a "URL copied" confirmation.

### Expanding and collapsing

Everything is **expanded by default** — including any category or sub category you create later. Click a category or sub category heading to collapse it, and that choice is remembered between launches. The **⇕** button beside the search box collapses everything at once, or expands everything if anything is currently collapsed.

### Moving the window

The app uses a hidden title bar so the toolbar sits flush with the top of the window. **Drag the app anywhere along the header bar** — the title, or the empty space beside it — to move the window. Double-click the same area to zoom.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘F` or `/` | Focus the search box |
| `⌘N` | New link (switches to the Add tab) |
| `⌘S` | Export library… |
| `⌘O` | Import library… |

---

## Where your data lives

Everything you add is written to a single JSON file:

**macOS**

```
~/Library/Application Support/com.damienbutler.ghdocmanager/library.json
```

The **Data** button in the app header shows you the exact path.

**Yes, it persists across app updates.** The file sits in your user Library folder, entirely separate from the application bundle. Replacing, reinstalling, or rebuilding the app does not touch it. The only things that would remove it are deleting the file yourself, or an uninstaller that explicitly clears application support data.

Every change — adding a link, editing notes, deleting an entry — saves immediately. Writes go to a temporary file which is then atomically renamed over the original, so a crash or power loss mid-save can't leave you with a truncated, unreadable library.

The format is deliberately plain and hand-editable:

```json
{
  "categories": {
    "GitHub Actions": ["Workflow syntax", "Caching"],
    "REST API": ["Repositories"]
  },
  "docs": [
    {
      "id": "k3f9a2b1m8x7",
      "title": "actions/cache — key vs restore-keys",
      "url": "https://github.com/actions/cache#skipping-steps-based-on-cache-hit",
      "category": "GitHub Actions",
      "subcategory": "Caching",
      "tags": ["cache", "ci", "performance"],
      "notes": "restore-keys is a prefix match, evaluated in order.",
      "created": "2026-07-28T11:24:03.881Z"
    }
  ]
}
```

---

## Backups, sync and sharing

**Export** (`⌘S`) writes the whole library to a `.json` file wherever you choose. **Import** (`⌘O`) reads one back and asks whether to:

- **Merge** — add entries whose URLs you don't already have, and union the category lists. Your existing entries and notes are untouched. This is what you want for combining libraries.
- **Replace** — discard the current library and use the imported one wholesale.

Because it's one small JSON file, a few options open up:

- **Backup** — export periodically, or just copy `library.json`.
- **Sync between machines** — export to a Dropbox/iCloud folder on one machine, import on the other.
- **Share with your team** — commit an exported `.json` to a repo. Everyone imports with **Merge**, and only picks up links they don't already have.

---

## Building from source

**Prerequisites**

- [Rust](https://rustup.rs) (stable)
- [Node.js](https://nodejs.org) 18 or newer — only for the Tauri CLI
- **macOS:** Xcode Command Line Tools — `xcode-select --install`

**Run in development**

```sh
git clone https://github.com/DamienButler/github-documentation-manager.git
cd github-documentation-manager
npm install
npm run dev
```

The first compile takes a minute or two while Rust builds its dependencies; subsequent runs start in seconds.

**Build a release app**

```sh
npm run build
```

The finished `.app` and `.dmg` land in `src-tauri/target/release/bundle/`.

**Regenerate the icon** (only if you change `scripts/make-icon.js`)

```sh
node scripts/make-icon.js
npx tauri icon src-tauri/icons/icon.png
```

---

## Project layout

```
├── src/                    Frontend — no framework, no build step
│   ├── index.html          Two-pane layout and tab structure
│   ├── styles.css          GitHub-dark theme
│   └── app.js              Tree, search, add form, detail pane, viewer control
├── src-tauri/              Rust backend
│   ├── src/lib.rs          Commands: storage, import/export, webview control
│   ├── src/main.rs         Entry point
│   ├── Cargo.toml          Rust dependencies
│   ├── tauri.conf.json     Window, bundle and build configuration
│   └── capabilities/       Permission grants for the frontend
└── scripts/make-icon.js    Dependency-free PNG icon generator
```

The frontend is plain HTML, CSS and JavaScript — no framework, no bundler, no transpiler. `src/index.html` can be opened directly in a browser, where it falls back to `localStorage` and an `<iframe>` preview.

---

## Security

Full detail is in [SECURITY.md](SECURITY.md), including how to report a vulnerability privately.

The short version: this is a local, single-user app with no server, no accounts and no telemetry. Tauri denies the frontend everything by default — the app requests only file dialogs, opening external URLs, and control of the viewer webview, granted explicitly in `src-tauri/capabilities/default.json`. URLs are validated in Rust and rejected unless `http`/`https`, documentation pages render in an isolated child webview with no access to app internals, and all library values are HTML-escaped before hitting the DOM.

Every push and pull request runs CodeQL (`security-extended`), `cargo audit`, `cargo deny`, `npm audit`, dependency review and a workflow-hardening audit. These also run weekly, so advisories published after a merge are still caught, and Dependabot keeps Rust, npm and Actions dependencies patched.

### Releasing

Push a version tag and the release workflow builds signed-less bundles for macOS (Apple Silicon and Intel), Windows and Linux, then attaches them to a **draft** release for you to review before publishing:

```sh
git tag v1.0.0
git push origin v1.0.0
```

---

## Licence

MIT
