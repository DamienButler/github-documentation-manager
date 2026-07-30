# Docu Manage

A small, fast desktop app for collecting, categorising and looking up documentation links — GitHub, Microsoft Learn, AWS, RFCs, internal wikis, anything with a URL. Keep each product's docs in its own tab, and read them **inside** the app rather than losing your place across browser tabs.

Built with [Tauri](https://tauri.app) — a Rust shell around the operating system's own webview. The whole app is a few megabytes, with no bundled Chromium.

---

## Contents

- [Why](#why)
- [Install](#install)
- [Using the app](#using-the-app)
  - [Documentation sets](#documentation-sets)
  - [Adding a link](#adding-a-link)
  - [Searching](#searching)
  - [Reading a document](#reading-a-document)
  - [Finding text in a page](#finding-text-in-a-page)
  - [Adding the page you're reading](#adding-the-page-youre-reading)
  - [Duplicates](#duplicates)
  - [Copying a URL](#copying-a-url)
  - [Keyboard shortcuts](#keyboard-shortcuts)
- [Where your data lives](#where-your-data-lives)
  - [Why one file](#why-one-file)
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
│ [GitHub][Microsoft][＋] │  Title                    [actions]  │
│  [Documentation] [Add]  │  Category › Sub category             │
│  ┌───────────────────┐  │  URL  https://…            [Copy]    │
│  │ Search…           │  │  #tags                               │
│  └───────────────────┘  │  Notes…                              │
│                         ├──────────────────────────────────────┤
│  ▼ GITHUB ACTIONS   2   │  ⟳  https://docs.github.com/…     ↗  │
│    ▼ Workflow syntax 1  ├──────────────────────────────────────┤
│      Workflow syntax…   │                                      │
│    ▼ Reusable wf…    1  │      (the live document renders      │
│      Reusing workflows  │       here, in a real webview)       │
│  ▼ REST API         1   │                                      │
│    ▼ Repositories    1  │                                      │
└─────────────────────────┴──────────────────────────────────────┘
```

### Documentation sets

The top row of tabs is one **set** per product — GitHub, Microsoft Learn, AWS, Python, whatever you need. Each set has its own independent categories, sub categories and documents, so a "REST API" category under GitHub has nothing to do with one under Microsoft.

- **Switch** by clicking a tab. The count beside each name is how many documents it holds.
- **Create** one with **＋ New tab**, name it, and you're taken straight to the Add link form.
- **Rename or delete** by right-clicking a tab. Deleting warns you how many documents will go with it, and you can't delete your last remaining set.

Search, the tree, and the Add link form all apply to the **currently selected set** only.

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

Above the document: **⟳** reloads it, **Find** searches within it, **＋ Add page** saves wherever you've browsed to, and **↗** opens the page in your normal browser.

**Editing notes.** Click **Edit notes**, type, then click away — it saves on blur. Good for accumulating the specific details you keep re-looking-up.

### Finding text in a page

Press `⌘F` while reading, or click **Find** in the viewer toolbar. A find bar appears in the top-right of the document:

- Type to highlight every match; the current one is highlighted more strongly and scrolled into view.
- `↵` for the next match, `⇧↵` for the previous, or use the **↑ ↓** buttons.
- The counter shows `3/17`, or `No results` when nothing matches.
- `Esc` closes the bar and clears the highlighting.

Matching ignores case, skips hidden elements, and works across text split by inline markup. Because the find bar lives inside the document itself, it keeps working as you follow links.

### Adding the page you're reading

Documentation sends you wandering — you open the page you saved, follow two links, and end up somewhere more useful than where you started. **＋ Add page** captures that.

It reads the URL the viewer is *currently* showing, switches to the **Add link** tab with the URL filled in, and suggests a title derived from the address (`…/caching-dependencies` → "Caching dependencies"). Anything still needed is outlined in amber, and focus goes to the first of them. Edit the title, pick a category, save.

`⌘D` does the same thing without reaching for the mouse.

> The page's real `<title>` would make a better suggestion, but reading it would mean granting the app's internal messaging to every site you visit. A title you edit is a fair trade for not widening that boundary — see [Security](#security).

### Duplicates

The same URL can't be saved twice, in any set.

As you type or paste into the URL field, a warning appears if it's already saved — naming the existing entry, where it lives, and offering **Go to it**. Saving is blocked with the same message if you ignore the warning, and **＋ Add page** checks before it does anything.

Matching is deliberately forgiving about things that don't change the destination — a trailing slash, `www.`, capitalised host, `:443`, or tracking parameters like `utm_source` all count as the same page. Things that *do* matter stay distinct: different paths, different anchors (`#install` vs `#usage`), and meaningful query strings like `?version=2`.

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
| `⌘F` | Find in the page you're reading (falls back to the library search when nothing is open) |
| `⌘K` or `/` | Focus the library search box |
| `⌘D` | Add the page currently shown |
| `⌘N` | New link (switches to the Add tab) |
| `⌘S` | Export library… |
| `⌘O` | Import library… |

`⌘F` follows the convention every browser and editor uses — search what you're
reading. The library search moved to `⌘K`, which is what most search-palette
UIs use.

---

## Where your data lives

Everything you add is written to a single JSON file:

**macOS**

```
~/Library/Application Support/com.damienbutler.documanage/library.json
```

The **Data** button in the app header shows you the exact path.

**Yes, it persists across app updates.** The file sits in your user Library folder, entirely separate from the application bundle. Replacing, reinstalling, or rebuilding the app does not touch it. The only things that would remove it are deleting the file yourself, or an uninstaller that explicitly clears application support data.

Every change — adding a link, editing notes, deleting an entry — saves immediately. Writes go to a temporary file which is then atomically renamed over the original, so a crash or power loss mid-save can't leave you with a truncated, unreadable library.

The format is deliberately plain and hand-editable. **All sets live in one file** — see [why](#why-one-file) below.

```json
{
  "schemaVersion": 2,
  "activeProduct": "GitHub",
  "productOrder": ["GitHub", "Microsoft"],
  "products": {
    "GitHub": {
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
    },
    "Microsoft": { "categories": {}, "docs": [] }
  }
}
```

### Why one file

Every documentation set is stored in a single `library.json` rather than one file per product. That's a deliberate choice:

- **Saves stay atomic.** One write, one rename — the library is never half-updated. With several files, a crash between writes could leave sets disagreeing with each other.
- **One Export is a complete backup.** No risk of backing up four products and forgetting the fifth.
- **Import stays simple.** Merging one file into another is easy to reason about and easy to undo.
- **Size is a non-issue.** Even a few thousand links is a couple of hundred kilobytes — nothing worth splitting.

Separate files would only pay off if libraries grew to megabytes, or if you wanted to sync individual products independently. If that changes, the structure above splits cleanly along `products`, because each set is already self-contained.

### Upgrading from the old format

Version 1 stored a single flat `{ categories, docs }` object, from when this only handled GitHub docs. Those entries are migrated automatically into a set named **GitHub** the first time you run the new version — nothing is lost, and the old file is left in place as a backup.

---

## Backups, sync and sharing

**Export** (`⌘S`) writes the whole library — every set — to a `.json` file wherever you choose. **Import** (`⌘O`) reads one back and asks whether to:

- **Merge** — add entries whose URLs you don't already have, and union the category lists. Your existing entries and notes are untouched. This is what you want for combining libraries.
- **Replace** — discard the current library and use the imported one wholesale.

Because it's one small JSON file, a few options open up:

- **Backup** — export periodically, or just copy `library.json`.
- **Sync between machines** — export to a Dropbox/iCloud folder on one machine, import on the other.
- **Share with your team** — commit an exported `.json` to a repo. Everyone imports with **Merge**, and only picks up links they don't already have.

---

## Building from source

Full step-by-step instructions, including how to update an installed copy and
how releases are published, are in **[DEPLOY.md](DEPLOY.md)**. The short version:

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

**Update an installed copy after pulling changes**

```sh
./scripts/update.sh
```

Pulls, rebuilds and reinstalls to `/Applications`. Your library is stored
separately and is never touched. There is no in-app updater yet —
[UPDATER.md](UPDATER.md) sets out the plan for adding one.

**Regenerate the icon** (only if you change `scripts/make-icon.js`)

```sh
node scripts/make-icon.js
npx tauri icon src-tauri/icons/icon.png
```

---

## Project layout

```
├── src/                        Frontend — no framework, no build step
│   ├── index.html              Two-pane layout and tab structure
│   ├── styles.css              GitHub-dark theme
│   └── app.js                  Tree, search, add form, detail pane, viewer control
├── src-tauri/                  Rust backend
│   ├── src/lib.rs              Commands: storage, import/export, webview control
│   ├── src/find_in_page.js     Find bar injected into viewed documentation
│   ├── src/main.rs             Entry point
│   ├── Cargo.toml              Rust dependencies
│   ├── tauri.conf.json         Window, bundle and build configuration
│   └── capabilities/           Permission grants for the frontend
└── scripts/
    ├── make-icon.js            Dependency-free PNG icon generator
    ├── test-normalise.js       Duplicate-URL rules, and a library duplicate scan
    └── update.sh               Pull, rebuild and reinstall
```

The frontend is plain HTML, CSS and JavaScript — no framework, no bundler, no transpiler. `src/index.html` can be opened directly in a browser, where it falls back to `localStorage` and an `<iframe>` preview.

**Checking for duplicates in your own library:**

```sh
node scripts/test-normalise.js "$HOME/Library/Application Support/com.damienbutler.documanage/library.json"
```

Runs the matching rules as a test suite, then reports any URLs already saved
more than once.

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
