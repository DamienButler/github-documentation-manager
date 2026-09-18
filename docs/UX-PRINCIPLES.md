# Mebair — UX Principles

These principles describe how Mebair should behave as the product evolves. They are intended to guide implementation decisions and keep the interface aligned with the product's purpose.

## 1. Search first

Search is a primary interaction, not a secondary filter.

- Hive-wide search should be the default.
- Users should not need to remember which Hive section contains a resource.
- Search should include title, URL, Hive section, category, subcategory, tags and notes.
- `Cmd/Ctrl+K` should remain the fast path to Hive search.
- Page-level Find and Hive search are different actions and should remain clearly distinct.

## 2. Organise according to the user's mental model

The existing hierarchy is valuable:

**Hive section → Category → Subcategory → Resource**

Keep this structure.

Do not assume vendor documentation hierarchy is the correct hierarchy for the user.

A resource should be easy to move or edit later because a user's mental model may evolve over time.

## 3. Capture first, organise without friction

Saving a useful resource should be fast enough to do during active troubleshooting or engineering work.

Mebair should:

- capture the current page URL where possible
- provide a sensible starting title
- detect duplicates
- suggest likely Hive sections
- later suggest existing categories, subcategories and tags
- allow users to correct or ignore suggestions

Do not require perfect organisation before a useful resource can be captured.

An Inbox or Unsorted workflow may be introduced later.

## 4. Suggestions assist; users decide

Automated detection should be non-destructive.

Mebair may suggest:

- Hive section
- category
- subcategory
- tags
- resource type

It should not silently move, rename, categorise or reorganise resources.

The user remains in control of the Hive.

## 5. Preserve the two-pane workspace

The current two-pane layout is a strong part of the product.

Left pane:

- navigation
- Hive structure
- search
- resource selection
- capture/organisation controls

Right pane:

- selected resource context
- personal notes
- authoritative content in the embedded viewer

Do not replace this structure without a clear product reason.

The left pane should remain resizable and usable with many Hive sections.

## 6. Treat the viewer like lightweight browser navigation

Once a user follows links inside the embedded documentation viewer, navigation should behave predictably.

The intended viewer controls are:

- Back
- Forward
- Reload
- Find in page
- Add current page to Hive
- Open externally
- Return to the original saved resource

The visible URL should reflect the page actually being viewed rather than only the originally saved URL.

## 7. Keep personal context close to authoritative content

Personal notes are an important part of Mebair.

Users should be able to capture things such as:

- troubleshooting discoveries
- customer-specific reminders
- useful command context
- caveats
- links between related resources

Notes should remain easy to view and edit without overwhelming the authoritative source.

## 8. Full resource editing is expected

A saved resource should not become fixed after creation.

Users should eventually be able to edit:

- title
- URL
- Hive section
- category
- subcategory
- tags
- notes

Editing should preserve the user's existing data and avoid accidental duplication.

## 9. Progressive disclosure over toolbar clutter

Everyday actions should be prominent.

Administrative or infrequent actions such as:

- Data location
- Import
- Export

should not dominate the primary workflow.

Prefer progressive disclosure, menus or settings for lower-frequency management functions.

## 10. Keep metadata useful but compact

The documentation/resource itself should receive most of the right pane.

Title, breadcrumb, tags, URL and notes are useful, but should not consume unnecessary vertical space.

Prioritise:

1. what resource this is
2. where it lives in the Hive
3. the user's useful context
4. the authoritative content

## 11. Local-first is part of the experience

The product currently works without accounts, cloud sync or telemetry.

Preserve that simplicity unless a new cloud-dependent feature has been explicitly approved.

Users should understand where their data is stored and be able to export it.

## 12. Avoid unnecessary complexity

Mebair should stay focused.

Before adding a feature, ask whether it improves one of the core workflows:

- capture something useful
- organise it
- find it again
- read it
- add personal context

Avoid turning the product into a generic productivity suite.

## Current UX priorities

The current agreed implementation order is maintained in `docs/AI-HANDOFF.md`.

At present the major priorities are:

1. Hive-wide search
2. viewer navigation
3. full resource editing
4. smarter Add to Hive
5. quick capture / Inbox
6. UI cleanup
7. Mebair branding

Do not automatically start the next roadmap item after completing the current assigned task.
