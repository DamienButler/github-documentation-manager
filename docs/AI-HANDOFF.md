# Mebair — AI Handoff

## Current product direction

Mebair by GeoBee is a personal technical knowledge companion.

Users build a Hive of technical resources organised according to their own mental model.

Core idea:

> Find it once. Find it again instantly.

Resources may eventually include documentation, URLs, API endpoints, commands, snippets, screenshots and personal notes.

## Current working branch

`ux/hive-terminology`

## Completed / currently implemented

- Hive terminology
- "Add to Hive" terminology
- Scrollable Hive section tabs
- Fixed "+" button for creating Hive sections
- Resizable left sidebar with persisted width
- Capture the current page URL from the embedded viewer
- Derive an initial title from the URL
- Duplicate URL detection across the Hive
- Hostname detection
- Suggest likely Hive section from existing resources
- User explicitly accepts Hive-section suggestions rather than automatic moves

## Agreed next changes

1. Hive-wide search
   - Search all Hive sections by default
   - Search title, URL, tags, categories, subcategories and notes
   - Allow optional filtering to one Hive section

2. Viewer navigation
   - Back
   - Forward
   - Reload
   - Track/display the actual current page URL
   - Add the currently viewed page to the Hive
   - Ability to return to the original saved resource

3. Full resource editing
   - Title
   - URL
   - Hive section
   - Category
   - Subcategory
   - Tags
   - Notes

4. Smarter Add to Hive
   - Suggest Hive section
   - Suggest existing category/subcategory from similar saved resources
   - Suggest tags from the user's existing vocabulary
   - Never silently reorganise a user's Hive

5. Quick capture
   - Allow useful resources to be saved before fully organising them
   - Consider an Inbox / Unsorted location

6. UI cleanup
   - Move Data / Import / Export away from the primary everyday toolbar
   - Reduce metadata taking space above the documentation viewer

7. Mebair branding
   - Working product name: Mebair
   - Publisher: GeoBee
   - Collection terminology: Hive
   - Do not rename application/package/bundle identifiers until explicitly approved

## Later / not yet committed

- Favourites / pinned resources
- Recent resources
- Command palette
- Resource types beyond URLs
- Onboarding
- Sync / shared Hives
- AI-powered organisation or retrieval
- Commercial licensing / subscriptions

## Product principles

- Search is central to Mebair.
- Preserve Category → Subcategory organisation.
- Organise resources according to the user's mental model.
- Capture should be quick.
- Suggestions assist the user; they should not silently reorganise data.
- Keep the product local-first unless a cloud feature is explicitly approved.
- Avoid telemetry unless explicitly approved.
- Preserve backwards compatibility with existing libraries.

## AI working rules

- Do not push or merge to `main` unless Damien explicitly approves it.
- Do not make product-direction decisions implicitly.
- Read `docs/PRODUCT.md`, `docs/UX-PRINCIPLES.md` and this file before substantial changes.
- Commit and push a checkpoint before handing work between AI assistants.
