import { createGame, stackOverlap, sortScore } from './engine.js?v=2026.3';
import { randomInt, shuffled } from '../core.js?v=2026.3';

export function mountAdventure(root, type, c, api) {
  let game;
  const start = () => {
    game?.dispose();
    root.replaceChildren();
    api.feedback('');
    game = createGame(root, api);
    if (type === 'welcome' || type === 'quest') village(game);
    if (type === 'stack') giftStack(game);
    if (type === 'factory') factory(game);
    if (type === 'echo') echo(game);
  };
  const again = () => start();

  function village(g) {
    g.title('YOUR FIRST CHRISTMAS MISSION', 'Bring the village to life', 'Santa’s star lantern has scattered five sparks. Explore the snowy lanes, collect every star, then carry the magic to the great Christmas tree. No timer — enjoy the adventure!');
    const splash = g.el('div', '🧝 ✨ 🏘️ ✨ 🎄', root, 'adventure-splash');
    const begin = g.button('Start the adventure', () => { splash.remove(); begin.remove(); play(); }, root, 'gold');
    function play() {
      g.playing();
      const [count, steps] = g.hud(['Sparks found', 'Steps']);
      const bar = g.meter('Village magic', 5);
      const map = ['#######', '#.....#', '#.#.#.#', '#.#T#.#', '#.#.#.#', '#.....#', '#######'];
      let row = 5, col = 1, moves = 0, found = 0, finished = false;
      const candidates = [];
      map.forEach((line, r) => [...line].forEach((cell, k) => { if (cell === '.' && !(r === row && k === col)) candidates.push(`${r},${k}`); }));
      const stars = new Set(shuffled(candidates).slice(0, 5));
      const village = g.el('div', undefined, root, 'quest-village');
      const houses = Array.from({ length: 5 }, () => g.el('span', '🏠', village));
      const board = g.el('div', undefined, root, 'quest-board');
      board.tabIndex = 0;
      board.setAttribute('role', 'group');
      board.setAttribute('aria-label', 'Village map. Use arrow keys or the direction buttons to move.');
      const cells = map.map((line, r) => [...line].map((cell, k) => {
        const tile = g.el('span', '', board, 'quest-cell');
        tile.dataset.row = r; tile.dataset.col = k;
        if (cell === '#') tile.classList.add('wall');
        return tile;
      }));
      const draw = () => {
        cells.forEach((line, r) => line.forEach((tile, k) => {
          const isPlayer = row === r && col === k;
          tile.textContent = isPlayer ? '🧝' : stars.has(`${r},${k}`) ? '⭐' : map[r][k] === 'T' ? '🎄' : map[r][k] === '#' ? '🌲' : '·';
          tile.classList.toggle('player', isPlayer);
          tile.classList.toggle('spark', stars.has(`${r},${k}`));
        }));
        board.setAttribute('aria-label', `Village map. Elf at row ${row}, column ${col}. ${found} of 5 sparks collected. Use arrows or direction buttons.`);
        count.textContent = `${found} / 5`; steps.textContent = moves;
        bar.value = found;
        houses.forEach((h, i) => h.classList.toggle('lit', i < found));
      };
      const move = (dr, dc) => {
        if (finished) return;
        const r = row + dr, k = col + dc;
        if (!map[r] || map[r][k] === '#' || !map[r][k]) { api.feedback('A snowy hedge! Try another lane.'); return; }
        row = r; col = k; moves++;
        if (stars.delete(`${row},${col}`)) {
          found++; api.cue?.('success');
          api.feedback(found === 5 ? 'All five sparks! Follow the middle lane to the Christmas tree.' : `${found} sparks collected — another cottage is glowing!`);
        }
        draw();
        if (map[row][col] === 'T') {
          if (found < 5) api.feedback(`The tree needs ${5 - found} more sparks. Explore the village!`);
          else {
            finished = true; village.classList.add('all-lit');
            g.result({ score: Math.max(100, 500 - moves * 4), stars: 3, heading: 'You lit up Christmas!', detail: 'Five cosy cottages, one sparkling tree — and a whole December of adventures still to come.', stats: [`All 5 sparks collected in ${moves} steps`], restart: again });
          }
        }
      };
      g.listen(board, 'keydown', e => {
        const keys = { ArrowUp: [-1, 0], w: [-1, 0], ArrowDown: [1, 0], s: [1, 0], ArrowLeft: [0, -1], a: [0, -1], ArrowRight: [0, 1], d: [0, 1] };
        if (keys[e.key]) { e.preventDefault(); move(...keys[e.key]); }
      });
      g.listen(board, 'click', e => {
        const tile = e.target.closest('.quest-cell');
        if (!tile) return;
        const dr = Number(tile.dataset.row) - row, dc = Number(tile.dataset.col) - col;
        if (Math.abs(dr) + Math.abs(dc) === 1) move(dr, dc);
        else api.feedback('Tap a neighbouring square, or use the direction buttons.');
      });
      const controls = g.el('div', undefined, root, 'dpad');
      [['↑ Up', -1, 0], ['← Left', 0, -1], ['↓ Down', 1, 0], ['Right →', 0, 1]].forEach(([name, dr, dc]) => g.button(name, () => move(dr, dc), controls));
      draw(); board.focus();
    }
  }

  function giftStack(g) {
    g.title('THE GREAT GIFT STACK', 'Build a tower of Christmas cheer', 'Stop each swinging present above your tower. Only the overlapping part stays! Land neatly for a perfect-drop bonus. Stack 10 gifts to win. Space, Enter or the big Drop button.');
    const modeLabel = g.el('label', 'Choose your pace');
    const mode = g.el('select', undefined, modeLabel);
    [['cosy', 'Cosy — slower gifts, wider starting stack'], ['merry', 'Merry — a little extra challenge']].forEach(([value, label]) => { const o = g.el('option', label, mode); o.value = value; });
    const startButton = g.button('Start stacking', () => { const cosy = mode.value === 'cosy'; modeLabel.remove(); startButton.remove(); play(cosy); }, root, 'gold');
    function play(cosy) {
      g.playing();
      let width = cosy ? .64 : .52, x = .02, baseX = (1 - width) / 2, baseWidth = width;
      let score = 0, level = 0, lives = 3, direction = 1, last = 0, finished = false, paused = false;
      const [height, points, hearts] = g.hud(['Tower', 'Score', 'Chances']);
      const progress = g.meter('Tower height', 10);
      const stage = g.el('div', undefined, root, 'stack-stage game-stage');
      stage.setAttribute('aria-label', 'Gift stacking game. Use Drop present to stop the moving gift.');
      const base = g.el('div', '🎁', stage, 'stack-block base-block');
      base.style.left = `${baseX * 100}%`; base.style.width = `${width * 100}%`; base.style.bottom = '12px';
      const moving = g.el('div', '🎁', stage, 'stack-block moving-block');
      const draw = () => { moving.style.left = `${x * 100}%`; moving.style.width = `${width * 100}%`; moving.style.bottom = `${38 + level * 23}px`; height.textContent = `${level} / 10`; points.textContent = score; hearts.textContent = '♥'.repeat(lives); progress.value = level; };
      const controls = g.el('div', undefined, root, 'game-controls');
      const end = won => {
        if (finished) return; finished = true; drop.disabled = pause.disabled = true; moving.remove();
        g.result({ score, stars: won ? 3 : level >= 4 ? 2 : level ? 1 : 0, heading: won ? 'A towering triumph!' : 'One more gift?', detail: won ? 'Ten perfectly festive presents, ready for Santa’s sleigh.' : 'Watch the edges of the gift, then drop when they line up.', stats: [`${level} of 10 gifts stacked`], restart: again });
      };
      const drop = g.button('Drop present · Space', () => {
        if (finished || paused) return;
        const overlap = stackOverlap(x, width, baseX, baseWidth);
        const perfect = Math.abs(x - baseX) <= .035 && Math.abs(width - baseWidth) <= .04;
        if (overlap.width < .06) {
          lives--; api.feedback('That present tumbled! Your tower is safe — try the next one.'); api.cue?.('button');
          x = 0; direction = 1; draw(); if (!lives) end(false); return;
        }
        const block = g.el('div', perfect ? '✦ PERFECT' : '🎁', stage, 'stack-block settled-block');
        baseX = perfect ? baseX : overlap.x;
        baseWidth = perfect ? baseWidth : overlap.width;
        block.style.left = `${baseX * 100}%`; block.style.width = `${baseWidth * 100}%`; block.style.bottom = `${38 + level * 23}px`;
        level++; score += perfect ? 50 : 20; width = baseWidth;
        x = level % 2 ? 1 - width : 0; direction = level % 2 ? -1 : 1;
        api.feedback(perfect ? 'Perfect landing! +50' : 'Safely stacked! +20'); api.cue?.('success'); draw();
        if (level === 10) end(true);
      }, controls, 'gold');
      const pause = g.button('Pause', () => { paused = !paused; pause.textContent = paused ? 'Resume' : 'Pause'; drop.disabled = paused; }, controls);
      g.listen(stage.parentElement, 'keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && e.target === stage) { e.preventDefault(); drop.click(); } });
      stage.tabIndex = 0;
      const tick = now => {
        if (finished) return;
        const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
        if (!paused && !document.hidden) {
          x += direction * dt * ((cosy ? .26 : .4) + level * .025);
          if (x <= 0) { x = 0; direction = 1; }
          if (x + width >= 1) { x = 1 - width; direction = -1; }
          draw();
        }
        g.frame(tick);
      };
      draw(); g.frame(tick); drop.focus();
    }
  }

  function factory(g) {
    g.title('SANTA’S TOY FACTORY', 'The present-sorting express', 'The sleigh leaves soon! Match each toy to its labelled sack. Build a correct streak for bonuses. Sort 15 parcels; a wrong sack costs a chance, not the whole game. Keys 1, 2 and 3 work too.');
    const label = g.el('label', 'Factory shift');
    const mode = g.el('select', undefined, label);
    [['cosy', 'Cosy — no time pressure'], ['express', 'Express — 6 seconds per parcel']].forEach(([value, text]) => { const o = g.el('option', text, mode); o.value = value; });
    const startButton = g.button('Start the conveyor', () => { const timed = mode.value === 'express'; label.remove(); startButton.remove(); play(timed); }, root, 'gold');
    function play(timed) {
      g.playing();
      const categories = [{ label: 'Cuddly toys', icon: '🧸', toys: ['🧸', '🐰', '🐧'] }, { label: 'Things that move', icon: '🚂', toys: ['🚂', '🚗', '🚀'] }, { label: 'Music makers', icon: '🥁', toys: ['🥁', '🎸', '🎺'] }];
      const deck = shuffled(Array.from({ length: 15 }, (_, i) => ({ category: i % 3, toy: categories[i % 3].toys[randomInt(3)] })));
      let at = 0, score = 0, streak = 0, best = 0, lives = 3, elapsed = 0, last = 0, finished = false, paused = false, locked = false, correct = 0;
      const [parcels, points, hearts] = g.hud(['Parcels sorted', 'Score', 'Chances']);
      const bar = g.meter('Sleigh packed', 15);
      const stage = g.el('div', undefined, root, 'factory-stage');
      const toy = g.el('div', '', stage, 'factory-toy');
      const toyLabel = g.el('h4', '', stage);
      const clock = g.el('p', '', stage, 'small');
      const belt = g.el('div', '▰ ▰ ▰ ▰ ▰ ▰ ▰ ▰', stage, 'conveyor');
      belt.setAttribute('aria-hidden', 'true');
      const controls = g.el('div', undefined, root, 'sorting-bins');
      const draw = () => {
        parcels.textContent = `${at} / 15`; points.textContent = score; hearts.textContent = '♥'.repeat(lives); bar.value = at;
        if (at < deck.length) { toy.textContent = deck[at].toy; toyLabel.textContent = categories[deck[at].category].label; }
        clock.textContent = timed ? `${Math.max(0, Math.ceil(6 - elapsed))} seconds · Streak ${streak}` : `Take your time · Streak ${streak}`;
      };
      const finish = () => {
        if (finished) return; finished = true; buttons.forEach(b => b.disabled = true); pause.disabled = true;
        g.result({ score, heading: at === 15 ? 'The sleigh is packed!' : 'The workshop needs you!', detail: at === 15 ? 'A brilliant shift in Santa’s workshop. Can you beat your streak next time?' : 'Try the cosy shift and take your time matching each toy.', stats: [`${correct} correct · Best streak ${best}`], restart: again });
      };
      const choose = category => {
        if (finished || paused || locked) return;
        const right = category === deck[at].category;
        if (right) { score += sortScore(true, streak); streak++; correct++; best = Math.max(best, streak); api.cue?.('success'); }
        else { lives--; streak = 0; }
        api.feedback(right ? `Packed! ${streak >= 3 ? 'Brilliant streak! ' : ''}+${sortScore(true, streak - 1)}` : category === -1 ? 'That parcel missed the sleigh. Here comes another!' : 'Wrong sack! Look at the toy’s category before choosing.');
        at++; elapsed = 0; locked = true; buttons.forEach(b => b.disabled = true); draw();
        if (at === deck.length || !lives) { finish(); return; }
        g.later(() => { locked = false; buttons.forEach(b => b.disabled = paused); }, 300);
      };
      const buttons = categories.map((cat, i) => g.button(`${i + 1} · ${cat.icon} ${cat.label}`, () => choose(i), controls));
      const pause = g.button('Pause', () => { paused = !paused; pause.textContent = paused ? 'Resume' : 'Pause'; buttons.forEach(b => b.disabled = paused || locked); });
      g.listen(root, 'keydown', e => { if (['1', '2', '3'].includes(e.key) && !e.repeat) { e.preventDefault(); choose(Number(e.key) - 1); } });
      const tick = now => {
        if (finished) return;
        const dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
        if (!paused && !document.hidden && !locked) { elapsed += dt; if (timed && elapsed >= 6) choose(-1); draw(); }
        g.frame(tick);
      };
      draw(); if (timed) g.frame(tick); buttons[0].focus();
    }
  }

  function echo(g) {
    g.title('FROSTY’S FOOTSTEPS', 'Follow the winter lights', 'Watch Frosty’s glowing steps, then repeat them in the same order. Each round adds one step. Eight rounds, three chances, no rush when it is your turn. Use the four buttons or keys 1–4.');
    const startButton = g.button('Follow Frosty', () => { startButton.remove(); play(); }, root, 'gold');
    function play() {
      g.playing();
      const symbols = ['❄', '🎄', '🔔', '⭐'];
      const [round, points, hearts] = g.hud(['Round', 'Score', 'Chances']);
      let sequence = [], input = [], score = 0, lives = 3, accepting = false, finished = false, showing = false;
      const status = g.el('p', '', root, 'turn-status'); status.setAttribute('role', 'status');
      const grid = g.el('div', undefined, root, 'echo-grid');
      const buttons = symbols.map((symbol, i) => g.button(`${i + 1} · ${symbol}`, () => pick(i), grid, `echo-pad pad-${i}`));
      const update = () => { round.textContent = `${sequence.length} / 8`; points.textContent = score; hearts.textContent = '♥'.repeat(lives); };
      const end = won => {
        finished = true; accepting = false; buttons.forEach(b => b.disabled = true); repeat.disabled = true;
        g.result({ score, stars: won ? 3 : sequence.length >= 4 ? 2 : score ? 1 : 0, heading: won ? 'A magical memory!' : 'Frosty says: try again!', detail: won ? 'All eight winter-light patterns remembered. You are ready to lead the sleigh!' : 'Say the symbols aloud while you watch — it helps the pattern stick.', stats: [`Reached round ${sequence.length} of 8`], restart: again });
      };
      const flash = (index, ms = 450) => { buttons[index].classList.add('glowing'); api.cue?.('button'); g.later(() => buttons[index].classList.remove('glowing'), ms); };
      function show() {
        if (showing || finished) return;
        showing = true; accepting = false; input = []; repeat.disabled = true; buttons.forEach(b => b.disabled = true);
        status.textContent = 'Watch Frosty’s footsteps…';
        sequence.forEach((step, i) => g.later(() => flash(step), 600 + i * 750));
        g.later(() => { showing = false; accepting = true; buttons.forEach(b => b.disabled = false); repeat.disabled = false; status.textContent = `Your turn — repeat ${sequence.length} steps.`; buttons[0].focus(); }, 600 + sequence.length * 750);
      }
      function pick(index) {
        if (!accepting || finished) return;
        flash(index, 180);
        if (index !== sequence[input.length]) {
          lives--; accepting = false; update();
          api.feedback('A different footprint! Watch this pattern once more.');
          if (!lives) end(false); else g.later(show, 650);
          return;
        }
        input.push(index); status.textContent = `${input.length} of ${sequence.length} steps repeated`;
        if (input.length === sequence.length) {
          accepting = false; score += sequence.length * 10; api.feedback('Spot on! One more step…'); api.cue?.('success'); update();
          if (sequence.length === 8) end(true);
          else g.later(() => { sequence.push(randomInt(4)); update(); show(); }, 800);
        }
      }
      const repeat = g.button('Watch pattern again', () => { if (accepting && !finished) { lives--; update(); if (!lives) end(false); else show(); } });
      g.el('p', 'Watching again uses one chance. Your score comes from completing a pattern.', root, 'small');
      g.listen(root, 'keydown', e => { if (['1', '2', '3', '4'].includes(e.key) && !e.repeat) { e.preventDefault(); pick(Number(e.key) - 1); } });
      sequence = [randomInt(4)]; update(); show();
    }
  }

  start();
  return () => game?.dispose();
}
