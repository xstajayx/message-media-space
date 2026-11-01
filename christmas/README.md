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

Run `python3 tools/christmas-editor/server.py`, then visit the local editor address printed by it. The editor validates and exports the complete `content.json`; review and commit it to `christmas/content.json`. Change the year, daily titles/messages/types, quizzes (question, choices, correct zero-based index), 20+ jokes, riddles (question, hint, answer), wheel challenges, kindness tasks, code and finale greeting. Repeated awards are idempotent; best scores can improve. Resetting the local test bench never resets family progress.

The localhost server binds only to loopback, rejects unexpected Host headers and has no write endpoint. The workshop is an authoring tool, **not an authenticated admin area**. Its files are public source like the rest of this repository. There is no public future-date override, admin password or query-parameter bypass. The public demo explicitly allows testing all public activities and never opens real doors, saves tree designs or grants family stars.

### Photos and videos

`photos`: `[{"src":"media/public-photo.webp","alt":"Description","caption":"Winter walk"}]`.
`thenPhotos`: same shape plus `"year": 2010`. `video`: a relative MP4/WebM path, or an empty string. Media paths are validated; remote URLs, traversal and executable schemes are rejected. Missing photos/video show intentional fallbacks. Keep `photos` and `thenPhotos` empty and `video` empty for a family-safe public deployment. Original illustrated samples are provided. Visitors can select private photos/video from their device **for that visit only**, without uploading, saving or caching them. Do not add private photographs or videos to this public repository. True private shared media requires a separately designed authenticated backend and is intentionally unconfigured.

## Dates, profiles and rewards

Unlocks use Europe/London calendar dates and the configured year. Before December all doors are locked; previous days remain available; after the configured year every door stays available. The finale unlocks on 25 December. The date state refreshes every 30 seconds and on tab return. Device clocks and downloaded JavaScript can be changed: **static date locks are presentation controls, not security**. Never embed private or embargoed surprises in public files. Secure date validation would require a backend; none is configured.

Profiles have stable IDs, opened doors, named idempotent award records, best scores and a saved tree design. Versioned JSON in `christmas-v1` localStorage provides a future migration boundary for cloud sync. There is no cross-device synchronisation. No email, birthday, password or tracking is collected. Clearing browser data may erase progress. Audio settings are separate. Stars for an activity are awarded once per profile; replay improves best score but never repeatedly farms stars. The same browser profiles persist when content is changed to a new year; use a fresh browser storage profile for a fresh season.

## Games and access

All games are lazy-loaded from `games/index.js`; timers, animation frames and event listeners are disposed when the modal closes. Snowball catching and delivery use frame-time physics; the target game scores actual hits; sliding puzzle is solvable, memory uses matching detection, quizzes validate answers, and races/wheel use rejection-sampled cryptographic randomness. Touch, pointer, keyboard and button alternatives are supplied. Delivery: align below a house and press Deliver/Space. Reduced-motion disables decorative animation; the motion control pauses decoration, while game motion necessary for play remains active. Hidden tabs pause arcade elapsed time.

Core navigation uses native buttons, selects and modal dialogs, visible focus, status feedback and keyboard interaction. Artwork is original CSS/SVG plus system emoji (appearance varies by device). All music and effects are generated original oscillator sequences, started by user interaction. Tune clues refer to traditional songs with no recordings. No commercial assets are included.

## Offline and installation

The scoped service worker caches only an explicit list of public application files, never user-selected or configured family media. It uses network-first fetches and safe waiting-worker activation; close old tabs and reopen to apply an updated shell. Increment the cache version when changing the shell. All activities are small public code modules; they are fetched and cached only when an activity is first opened. Offline content can be stale; remote content and fresh updates require connectivity. Date presentation relies on the device clock. The relative manifest and SVG icon support installation where the browser supports them; platform install UI varies. No root-wide service worker is installed.
