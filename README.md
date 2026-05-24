# ExtractKit

ExtractKit is a Chrome Manifest V3 extension for creating and running local data extraction recipes on web pages.

A recipe describes what should be extracted from the active tab using CSS selectors. ExtractKit runs the recipe from the Chrome Side Panel, previews the structured JSON output, and lets you save runs locally using `chrome.storage.local`.

The project is intentionally local-first: there is no backend, login, cloud sync, or public recipe registry in the MVP.

## Features

- Create reusable extraction recipes with CSS selectors.
- Run compatible recipes against the active Chrome tab.
- Extract single values, simple lists, and repeated item groups.
- Preview extracted data as JSON.
- Save extraction runs locally.
- Import recipes from JSON or ZIP files.
- Export saved runs as a structured ZIP file.
- Keep all recipe and run data in the browser.

## Tech Stack

- Chrome Extension Manifest V3
- Chrome Side Panel API
- Vue 3
- Vite
- TypeScript
- Vue Router
- Tailwind CSS
- JSZip
- pnpm
- `chrome.storage.local`

## Requirements

- Node.js 18 or higher
- pnpm
- Google Chrome 116 or higher

## Install Dependencies

```bash
pnpm install
```

## Run in Development

```bash
pnpm dev
```

The Vite development server is useful for working on the UI, but Chrome extension APIs are only available when the built extension is loaded in Chrome.

## Build

```bash
pnpm build
```

The production build is generated in the `dist/` directory.

## Load the Extension in Chrome

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click **Load unpacked**.
4. Select the `dist/` directory.
5. Click the ExtractKit extension icon to open the Side Panel.

## Core Concepts

### Recipe

A recipe is a reusable extraction configuration. It defines URL patterns, fields, selectors, extraction modes, and optional transforms.

### Field Types

ExtractKit supports three main extraction shapes:

- **Single value**: extracts one value from the page.
- **Simple list**: extracts a list of values from matching elements.
- **Item list**: extracts repeated objects from a base selector, such as cards, products, links, or images.

### Run

A run is the result of executing a recipe on a specific URL. Runs can be previewed, saved locally, and exported later.

## Create a Recipe

1. Open the **Recipes** tab.
2. Click **New Recipe**.
3. Add the recipe name, version, and compatible URL patterns.
4. Add fields using one of the supported field types:
   - **Single value** for one extracted value.
   - **Simple list** for an array of values.
   - **Item list** for repeated objects with nested fields.
5. Choose the extraction mode, such as text, HTML, attribute, JSON, exists, or count.
6. Save the recipe.

## Import Recipes

1. Open the **Recipes** tab.
2. Click **Import**.
3. Select one or more `.recipe.json`, `.json`, or ExtractKit `.zip` files.
4. Recipes with the same ID as an existing local recipe are imported as copies to avoid overwriting local data.

The importer accepts:

- a single recipe JSON file;
- a list of recipes;
- an object with `recipesById`;
- `recipes/*.recipe.json` files inside an ExtractKit ZIP export.

## Run a Recipe

1. Open any regular web page in Chrome.
2. Open the ExtractKit Side Panel.
3. Go to the **Run** tab.
4. Check the current URL.
5. Select a compatible recipe.
6. Click **Run recipe**.
7. Review the extracted JSON, warnings, and errors.
8. Click **Save** to store the run locally.

## Export Runs

1. Open the **Runs** tab.
2. Filter by recipe, domain, or URL if needed.
3. Open an individual run to inspect its JSON.
4. Click **Export** on a run, or click **Export all** to export everything.

The generated `.zip` file contains:

- `manifest.json` with export metadata;
- `recipes/*.recipe.json` with recipes used by the exported runs;
- `runs/*.json` with each saved run;
- `data/all-runs.json` with all exported runs;
- `data/all-runs.csv` with a tabular version of the exported data.

## Local Storage

ExtractKit stores data locally in the browser through `chrome.storage.local`.

The extension does not send recipes or extracted data to a server in the MVP.

## Scripts

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm preview
```

If Biome is configured in the project, these scripts may also be available:

```bash
pnpm lint
pnpm format
pnpm check
pnpm check:write
```

## Project Status

ExtractKit is currently an MVP focused on local extraction workflows.

Planned improvements may include a visual element picker, a richer JSON viewer, starter recipes, recipe categories, SEO QA recipes, and a public recipe gallery.
