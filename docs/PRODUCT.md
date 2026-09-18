# Mebair — Product

## Product identity

**Working product name:** Mebair  
**Publisher:** GeoBee  
**Primary collection term:** Hive

Mebair is a personal technical knowledge companion for engineers, support professionals and other technical users who repeatedly return to documentation, commands, APIs, troubleshooting references and other useful resources.

The product is built around a simple idea:

> Find it once. Find it again instantly.

## Problem

Technical users regularly discover useful documentation while solving real problems, then struggle to find it again later.

Browser bookmarks are useful for storage, but they become difficult to navigate as they grow. Browser address-bar search may find a previously visited page, but it does not reliably reflect the user's own categories, tags, notes or mental model.

Mebair gives users a curated technical reference workspace organised according to how they personally remember and think about their work.

## Core product model

A user's complete collection is their **Hive**.

The Hive can contain multiple sections such as:

- GitHub
- Microsoft
- AWS
- Kubernetes
- Python
- Internal references

Within a section, resources can be organised using:

**Hive section → Category → Subcategory → Resource**

This hierarchy should remain flexible enough to reflect the user's own mental model rather than a vendor's documentation taxonomy.

Example:

**GitHub → Security → Audit streaming → Streaming the audit log**

## Core workflow

The primary workflow is:

1. Find a useful technical resource while working.
2. Add it to the Hive quickly.
3. Organise it using the user's own categories, subcategories and tags.
4. Add personal notes or troubleshooting context when useful.
5. Search the Hive later using whatever part of the resource the user remembers.
6. Open the authoritative source directly inside the workspace.

The product should reduce the time between:

> "I know I've seen this before"

and:

> "Here it is."

## Resources

The current application is primarily URL/documentation based.

The product model should allow Mebair to expand later to resources such as:

- documentation pages
- URLs
- API endpoints
- commands
- snippets
- screenshots
- personal notes
- troubleshooting references

Do not force these future resource types into the product before they are needed.

## Search

Search is central to Mebair.

The intended search experience is Hive-wide by default and should allow users to find resources using:

- title
- URL
- Hive section
- category
- subcategory
- tags
- notes

Users should not need to remember which Hive section contains a resource before searching for it.

## Capture

Capture should be fast.

When adding the page currently being viewed, Mebair should help by detecting or suggesting useful metadata such as:

- current URL
- starting title
- duplicate resources
- likely Hive section
- existing category/subcategory
- existing tags

Suggestions should assist the user, not silently reorganise the Hive.

Longer term, users should be able to save something useful before fully organising it, potentially through an Inbox or Unsorted location.

## Viewer

The embedded viewer exists so that the authoritative source remains central to the workflow.

The intended viewer experience includes:

- Back
- Forward
- Reload
- Find in page
- display the actual current page URL
- Add the currently viewed page to the Hive
- open externally in the user's normal browser
- return to the original saved resource

## Product positioning

Mebair is not intended to become:

- a generic bookmark manager
- a documentation authoring system
- a Notion replacement
- a full second-brain platform
- a cloud knowledge base by default

It is a focused technical reference companion designed to make previously discovered technical knowledge easy to retrieve and reuse.

## Product principles

- Organise around the user's mental model.
- Keep authoritative sources central.
- Make retrieval faster than rediscovery.
- Keep capture lightweight.
- Preserve useful structure without making organisation burdensome.
- Keep the product local-first unless a cloud feature is explicitly approved.
- Avoid telemetry unless explicitly approved.
- Preserve user data and backwards compatibility during schema changes.
- Do not introduce AI simply for novelty; use it only where it materially improves the workflow.

## Brand direction

Mebair is the current working product name.

The name is inspired by an old Irish word associated with memory and recollection.

Current working brand architecture:

**Mebair** — product  
**GeoBee** — publisher/company  
**Hive** — the user's curated collection

Current working tagline:

> Find it once. Find it again instantly.

The product name, package name, bundle identifier and repository name should not be renamed until explicitly approved.
