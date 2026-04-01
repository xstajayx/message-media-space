# DEV NOTES

## File map (hub + content)
- `index.html`
  - Main hub page with all prank/game cards hardcoded in HTML.
  - Filter controls (`All / Pranks / Games`) toggle section visibility with `setFilter(...)`.
  - `shareLink(url, kind)` handles Web Share API, clipboard fallback, and prompt fallback.
  - Trending scores UI is rendered from localStorage key `mms_scores`.
  - `saveScoreFromParams()` reads `?game=<slug>&score=<number>` from URL and updates per-game best score.
- `p/<slug>/index.html`
  - Individual prank and game pages.
  - Games generally use local page logic and can send results back to hub using `MAIN_PAGE_URL?game=...&score=...`.
- `brainrot-database.html`
  - Standalone static fan database page for Steal a Brainrot.
  - Loads data from `assets/data/brainrots.json` and metadata from `assets/data/brainrot-metadata.json`.
  - Uses `assets/css/brainrot-database.css` and `assets/js/brainrot-database.js`.
  - Supports search, filter, sort, URL state, localStorage state, and deep-link modal.

## How cards/categories are wired
- Cards are currently **hardcoded HTML blocks** in `index.html` (no JSON/array source).
- Categories are determined by which section the card is in:
  - Pranks section: `<div class="section" id="secPranks">`
  - Games section: `<div class="section" id="secGames">`
- Filter buttons toggle those two sections only.

## How to add a new prank/game so it appears on the hub
1. Create a new folder in `p/` using lowercase kebab-case, e.g. `p/my-new-game/index.html`.
2. Add a card block in `index.html`:
   - Add prank cards inside `#secPranks`.
   - Add game cards inside `#secGames`.
3. Set Open button URL to the GitHub Pages absolute path:
   - `https://xstajayx.github.io/message-media-space/p/<slug>/`
4. Set Share button to call:
   - `shareLink('https://xstajayx.github.io/message-media-space/p/<slug>/', 'Prank' or 'Game')`
5. For games that should surface in Trending:
   - Send users to hub with params (share or back): `?game=<slug>&score=<number>`
  - Add a friendly display name in the `names` map inside `renderTrending()`.

## Brainrot database data updates
- Edit `assets/data/brainrots.json` directly to add/update entries.
- Keep schema keys consistent (`id`, `name`, `rarity`, `spawnMethod`, `roadWeight`, etc.).
- If a value is unverified, use `null`, `Unknown`, or `Needs verification` in `notes` rather than guessing.
- The hub card link for this page is in `index.html` under the mini games section:
  - `./brainrot-database.html`

## Trending scores behavior
- Source: `localStorage['mms_scores']` as JSON object: `{ "game-slug": bestScore }`.
- Write path:
  - Hub function `saveScoreFromParams()` parses URL params and updates the best score for that slug.
- Display path:
  - `renderTrending()` sorts scores descending and renders top 5 rows.
- Clear control:
  - Hub `Clear` button deletes `mms_scores` and rerenders the trending box.
