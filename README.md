# Steal a Brainrot Database

A static, browser-only fan website for browsing community-tracked Roblox **Steal a Brainrot** characters.

> **Unofficial fan-made database. Not affiliated with Roblox or the game developers.**

## Features

- Search by Brainrot name
- Filter by rarity and spawn method
- Sorting by name, rarity, cost, and income
- Detail modal with full known fields
- URL query sharing (filters + selected Brainrot)
- `localStorage` filter persistence
- Mobile-first responsive card grid
- Zero backend / GitHub Pages compatible

## Project structure

```text
.
├── index.html
├── about.html
├── styles.css
├── app.js
├── favicon.svg
└── data/
    ├── brainrots.json
    └── metadata.json
```

## Run locally

Because the app loads JSON with `fetch`, run it with a local static server:

### Python

```bash
python3 -m http.server 8080
```

Open: <http://localhost:8080>

### Node (optional)

```bash
npx serve .
```

## Deploy on GitHub Pages

1. Push this project to a GitHub repository.
2. In GitHub, go to **Settings → Pages**.
3. Set source to **Deploy from branch**.
4. Select branch (`main` or your chosen branch) and folder `/ (root)`.
5. Save. GitHub Pages will publish your static files.

No build step is required.

## Data model (`data/brainrots.json`)

Each entry supports:

```json
{
  "id": "string-slug",
  "name": "string",
  "rarity": "Common | Rare | Epic | Legendary | Mythic | Brainrot God | Secret | OG",
  "summary": "short description",
  "cost": 0,
  "incomePerSecond": 0,
  "spawnMethod": "Red Carpet | Lucky Block | Event | Ritual | Special | Unknown",
  "roadWeight": 0,
  "notes": "string",
  "sourceTags": ["Community Wiki", "Guide", "Manual Entry"],
  "lastUpdated": "YYYY-MM-DD"
}
```

### Field notes

- `cost`: Community-tracked unlock/purchase value when known.
- `incomePerSecond`: Community-tracked passive value when known.
- `spawnMethod`: How players report obtaining the Brainrot.
- `roadWeight`: **Weighted spawn value**, not automatically a percent. It may be a number, qualitative string (like `Low`), or `null` if unknown.
- `notes`: Add context like patch uncertainty or `Needs verification`.
- `sourceTags`: Labels for where the value came from.

## How to update the database

1. Open `data/brainrots.json`.
2. Add/edit entries using the schema above.
3. If you add new rarity/spawn method categories, update `data/metadata.json` (`supportedRarities`, `supportedSpawnMethods`).
4. Update `totalCount` in `metadata.json`.
5. Commit and deploy.

## How to add a new Brainrot

1. Create a unique slug for `id`.
2. Fill known fields.
3. Set uncertain numeric fields to `null`.
4. Add `notes: "Needs verification"` when uncertain.
5. Add at least one `sourceTags` label.
6. Set `lastUpdated` to the edit date.

## Legal / attribution

This project intentionally avoids copyrighted game art, ripped assets, and scraped images.
Cards use UI-only visuals and placeholder silhouettes.

**Unofficial fan-made database. Not affiliated with Roblox or the game developers.**
