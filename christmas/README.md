# The Magical Christmas Countdown

Static GitHub Pages application at `./christmas/` (including repository base paths such as `/message-media-space/christmas/`). No npm dependencies, backend, analytics or build step. Existing hub links and games are preserved. Python 3, Chromium and Python Playwright are available in the development environment.

## Run and validate

From the repository root:

```
python3 -m http.server 8000 --bind 127.0.0.1
python3 christmas/tests/check.py
```

The test script starts its own temporary server and Chromium. If sockets are sandbox-restricted, use the supported elevated execution flow. The site can be served directly by GitHub Pages; retain the repository's existing Pages source settings. There was no deployment workflow to modify. No production deployment is performed by these changes.

## Personalise

Run `python3 tools/christmas-editor/server.py`, then visit the local editor address printed by it. The editor validates and exports the complete `content.json`; review and commit it to `christmas/content.json`. Change the year, daily titles/messages/types, quizzes (question, choices, correct zero-based index), 20+ jokes, riddles (question, hint, answer), wheel challenges, kindness tasks, code, the day-9 `santaMessage` and finale greeting. Repeated awards are idempotent; best scores can improve. Resetting the local test bench never resets family progress.

The localhost server binds only to loopback, rejects unexpected Host headers and has no write endpoint. The workshop is an authoring tool, **not an authenticated admin area**. Its files are public source like the rest of this repository. There is no public future-date override, admin password or query-parameter bypass. The public demo explicitly allows testing all public activities and never opens real doors, saves tree designs or grants family stars.

### All play, no uploads

Days 1, 3, 13 and 19 now feature Light Up the Christmas Village, The Great Gift Stack, Santa’s Toy Factory and Frosty’s Footsteps. The photo gallery, video player, photo-year guessing, all visitor photo/video pickers and media configuration have been removed. The finale offers a bonus Toy Factory round. No personal media is requested or stored. Existing family profiles, stars and opened doors remain intact.

## Dates, profiles and rewards

Unlocks use Europe/London calendar dates and the configured year. Before December all doors are locked; previous days remain available; after the configured year every door stays available. The finale unlocks on 25 December. The date state refreshes every 30 seconds and on tab return. Device clocks and downloaded JavaScript can be changed: **static date locks are presentation controls, not security**. Never embed private or embargoed surprises in public files. Secure date validation would require a backend; none is configured.

Profiles have stable IDs, opened doors, named idempotent award records, best scores and a saved tree design. Versioned JSON in `christmas-v1` localStorage provides a future migration boundary for cloud sync. There is no cross-device synchronisation. No email, birthday, password or tracking is collected. Clearing browser data may erase progress. Audio settings are separate. Stars for an activity are awarded once per profile; replay improves best score but never repeatedly farms stars. The same browser profiles persist when content is changed to a new year; use a fresh browser storage profile for a fresh season.

## Games and access

Games load only when an activity opens. `games/index.js` routes the original puzzles; `adventures.js` contains the village quest, gift stacking, toy sorting and pattern memory. `arcade.js` contains Elf Snowball Showdown, snowflake catching and sky delivery. `workshop.js` contains the plain-tree decorator, detailed Santa search and signal puzzle; `workshop-art.js` provides their original SVG artwork. The shared `engine.js` owns timers, event listeners and animation frames, and exports pure scoring/collision helpers. Closing or restarting a game disposes its resources.

- **Day 1: Light Up the Village.** Explore a connected maze with arrows/WASD, direction buttons or adjacent-square taps. Collect five random sparks and return to the tree. There is no timer; points reward an efficient route. Completing the quest lights all five cottages and awards three stars once.
- **Day 3: Gift Stack.** Space/Enter on the arena or Drop present stops a moving gift. Only overlapping width survives; near-perfect landings preserve width and score a bonus. Ten layers win; three missed drops end the game. Cosy and Merry speeds, pause and restart are included.
- **Day 12: Elf Snowball Showdown.** Nine workshop windows, three ten-second waves, normal/golden elves, snowmen to avoid, accuracy and best-streak results. Tap, Enter on a focused window or number keys 1–9. Each target can score once. Empty shots and expired elves break the streak; snowmen deduct points. Cosy and Merry pacing, pause and hidden-tab suspension are supported.
- **Day 8: The Great Santa Search.** Find four specific details among 24 original vector lookalikes in each of three neighbourhoods. Hats, scarves and patterns distinguish the targets; generic character clicks do not win. Detective mode is untimed; Blizzard allows 120 seconds for all scenes. Wrong guesses cost five points; a one-time spotlight for each clue costs fifteen. Zoom view enlarges the scene for panning, and every object has an accessible descriptive label. Pause and restart are supported.
- **Day 9: Santa’s Secret Signal.** Rotate nine radio tiles to connect every tile from the lantern to the receiver. Correct reciprocal connections illuminate live. Sending is disabled until a valid full route exists; completing the transmission reveals a personalised Santa letter. A tile assist costs points. Change the final letter with `santaMessage` in content.json; it renders as plain text.
- **Day 13: Toy Factory.** Identify 18 possible toys from their pictures, with no on-screen answer labels. Match 15 parcels to three sacks using buttons or keys 1–3. Sacks swap positions after parcels five and ten; number keys follow their current order. Express mode has six, then five, then four seconds per parcel. Cosy mode remains untimed. Wrong answers or expired parcels cost one of three chances. Screen readers receive the pictured toy’s name, without its category. The bonus Christmas Day game uses the same improved rules and its own award record.
- **Day 15: Decorate the Tree.** A new profile or demo starts with an original plain evergreen SVG: no built-in star, baubles or lights. Tap branches or use the position menu to add ornaments; tap an ornament to remove it. Fairy lights are added only by the player. Undo and clear work locally, and completed designs restore when revisiting. Existing user-added decorations are preserved, including legacy gifts and snowflakes. No new stars can be farmed by repeatedly saving.
- **Day 19: Frosty’s Footsteps.** Watch and repeat a growing pattern of one to eight lights. Buttons or keys 1–4; three chances. Rewatching costs a chance, and pattern scoring requires a complete correct sequence. Players cannot score while the pattern is being shown.
- **Catch and delivery.** Thirty-second rounds with visible time/progress, combos, score summaries and a pause button. Hold arrows/A/D or direction buttons, or move by pointer/touch. Catch golden stars and avoid clouds. Delivery launches actual parcels at the glowing destination; clouds can intercept them. Collision coordinates use proportions, so resizing preserves the field.

Original puzzle improvements include a finished-picture reference, focus preservation after sliding a tile, and immediate pair feedback for memory match. The new arcade rounds and adventure timers pause progression in hidden tabs. Reduced-motion disables decoration without removing essential target/sequence feedback.

Core navigation uses native buttons, selects and modal dialogs, visible focus, status feedback and keyboard interaction. Artwork is original CSS/SVG plus system emoji (appearance varies by device). All music and effects are generated original oscillator sequences, started by user interaction. Tune clues refer to traditional songs with no recordings. No commercial assets are included.

## Offline and installation

The scoped service worker caches only an explicit list of public application files, and never caches personal media. It uses network-first fetches and safe waiting-worker activation; close old tabs and reopen to apply an updated shell. Release `2026.4` versions the complete JavaScript module graph, stylesheet and content request together so fresh game data is not validated by old cached code. Update `RELEASE` in `core.js` and `sw.js`, the versioned imports, and the HTML script/stylesheet URLs together for future releases. The worker bypasses the browser HTTP cache when online and waits for cache writes to complete. All activities are small public code modules; they are fetched and cached only when an activity is first opened. Offline content can be stale; remote content and fresh updates require connectivity. Date presentation relies on the device clock. The relative manifest, PNG install icons and SVG favicon support installation where the browser supports them; platform install UI varies. No root-wide service worker is installed.

### Recovering an interrupted update

Startup registers the worker even if content loading fails. A failed HTTP request or invalid content now shows loading details and a **Retry loading the village** button. Retrying keeps existing local profiles and rewards. Once this fix has been merged and GitHub Pages has finished updating, open the calendar with `?refresh=2026.4` once to request fresh HTML. You do not need to clear browser data. Close old calendar tabs before reopening for the new offline worker to activate. An older cached HTML shell is supported when it receives the updated script.
