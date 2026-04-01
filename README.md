# Message Media Space

Static GitHub Pages site with prank/game links plus a fan-made **Steal a Brainrot Database**.

## New Brainrot database files
- `brainrot-database.html` – standalone database page.
- `assets/css/brainrot-database.css` – page styles matching the site theme.
- `assets/js/brainrot-database.js` – search/filter/sort/modal behavior.
- `assets/data/brainrots.json` – character dataset.
- `assets/data/brainrot-metadata.json` – dataset source metadata.

## Where the home-page link was added
The hub card/link is in `index.html` under the **Mini games** section as **Steal a Brainrot Database**.

## How to add or update brainrots
1. Open `assets/data/brainrots.json`.
2. Add/update entries with this schema:
   - `id`, `name`, `aliases`, `rarity`, `summary`, `spawnMethod`, `roadWeight`, `notes`, `sourceTags`, `sourceUrls`, `lastUpdated`
3. Use `Unknown`, `null`, or `Needs verification` for fields you cannot verify yet.
4. Keep `sourceTags`/`sourceUrls` for traceability.
5. Save file; frontend updates automatically (no build step).

## Local preview
Open `index.html` directly or use any static server. Paths are relative and GitHub Pages safe.
