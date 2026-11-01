import { createGame, targetShot } from './engine.js?v=2026.5';
import { randomInt } from '../core.js?v=2026.5';

export function mountArcade(root, kind, api) {
  let game;
  const again = () => {
    game?.dispose(); root.replaceChildren(); api.feedback(''); game = createGame(root, api);
    if (kind === 'target') target(game); else skyGame(game);
  };
  function target(g) {
    g.title('ELF SNOWBALL SHOWDOWN', 'The workshop is your snowball arena', 'Tap the elves as they pop out of the workshop windows. Three hits in a row build your multiplier. Golden elves are worth double. Leave the snowmen alone! Three waves, 30 seconds.');
    const label = g.el('label', 'Choose your challenge');
    const difficulty = g.el('select', undefined, label);
    [['cosy', 'Cosy — longer visits, gentler pace'], ['merry', 'Merry — faster elves, bigger challenge']].forEach(([v, t]) => { const o = g.el('option', t, difficulty); o.value = v; });
    g.el('p', 'Tap a window, focus it and press Enter, or use number keys 1–9. Missing an elf breaks your streak. Snowmen cost 15 points.', root, 'small game-help');
    const start = g.button('Start', () => { const cosy = difficulty.value === 'cosy'; label.remove(); start.remove(); play(cosy); }, root, 'gold');
    function play(cosy) {
      g.playing();
      let state = { score: 0, streak: 0, best: 0, hits: 0, shots: 0 };
      let elapsed = 0, last = 0, spawn = .7, wave = 1, missed = 0, paused = false, finished = false, spawned = 0;
      const slots = Array(9).fill(null);
      const [points, clock, combo] = g.hud(['Score', 'Time', 'Combo']);
      const waveLabel = g.el('p', 'Wave 1 · Warming up', root, 'wave-label');
      const bar = g.meter('Round time remaining', 30, 30);
      const board = g.el('div', undefined, root, 'elf-workshop');
      board.setAttribute('role', 'group'); board.setAttribute('aria-label', 'Nine workshop windows. Number keys 1 to 9 throw a snowball.');
      const badges = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const buttons = badges.map((badge, i) => {
        const b = g.button('', () => shoot(i), board, 'elf-window');
        g.el('span', badge, b, 'window-number');
        g.el('span', '✦', b, 'window-visitor');
        g.el('span', '', b, 'window-points');
        b.setAttribute('aria-label', `Window ${i + 1}: empty`);
        return b;
      });
      const setSlot = (i, value) => {
        slots[i] = value;
        const b = buttons[i];
        b.classList.remove('elf', 'gold-elf', 'snowman', 'hit');
        if (value) b.classList.add(value.kind === 'gold' ? 'gold-elf' : value.kind === 'elf' ? 'elf' : 'snowman');
        b.querySelector('.window-visitor').textContent = !value ? '✦' : value.kind === 'snowman' ? '⛄' : '🧝';
        b.querySelector('.window-points').textContent = !value ? '' : value.kind === 'snowman' ? 'DON’T HIT' : value.kind === 'gold' ? 'DOUBLE!' : 'SNOWBALL!';
        b.setAttribute('aria-label', `Window ${i + 1}: ${!value ? 'empty' : value.kind === 'snowman' ? 'snowman — do not hit' : value.kind === 'gold' ? 'golden elf target' : 'elf target'}`);
      };
      const update = () => { points.textContent = state.score; clock.textContent = `${Math.max(0, Math.ceil(30 - elapsed))}s`; combo.textContent = `×${Math.min(4, 1 + Math.floor(state.streak / 3))} · ${state.streak} streak`; bar.value = Math.max(0, 30 - elapsed); };
      function shoot(i) {
        if (paused || finished) return;
        const slot = slots[i];
        const previous = state.score;
        state = targetShot(state, slot?.kind || 'empty');
        if (!slot) api.feedback('Empty window — wait for an elf! Streak reset.');
        else {
          setSlot(i, null);
          const b = buttons[i]; b.classList.add('hit');
          g.later(() => b.classList.remove('hit'), 180);
          if (slot.kind === 'snowman') api.feedback('That’s our snowman friend! −15 points.');
          else { api.feedback(`${slot.kind === 'gold' ? 'Golden elf!' : 'Snowball hit!'} +${state.score - previous}${state.streak >= 3 ? ` · ${state.streak} in a row!` : ''}`); api.cue?.('button'); }
        }
        update();
      }
      const controls = g.el('div', undefined, root, 'game-controls');
      const pause = g.button('Pause', () => { paused = !paused; pause.textContent = paused ? 'Resume' : 'Pause'; buttons.forEach(b => b.disabled = paused); board.classList.toggle('game-paused', paused); api.feedback(paused ? 'Snowballs down! Your round is paused.' : 'Back to the workshop!'); }, controls);
      g.listen(root, 'keydown', e => { if (/^[1-9]$/.test(e.key) && !e.repeat) { e.preventDefault(); shoot(Number(e.key) - 1); } });
      const finish = () => {
        finished = true; buttons.forEach(b => b.disabled = true); pause.disabled = true;
        for (let i = 0; i < 9; i++) setSlot(i, null);
        g.result({ score: state.score, heading: state.score >= 200 ? 'Chief snowball elf!' : state.score >= 80 ? 'A flurry of festive hits!' : 'Your next snowball story awaits', detail: 'The elves are heading in for cocoa. Fancy one more round?', stats: [`${state.hits} hits · ${state.shots ? Math.round(state.hits / state.shots * 100) : 0}% accuracy`, `Best streak ${state.best} · ${missed} elves escaped · ${cosy ? 'Cosy' : 'Merry'} mode`], restart: again });
      };
      const tick = now => {
        if (finished) return;
        const dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
        if (!paused && !document.hidden) {
          elapsed += dt; spawn += dt;
          const newWave = Math.min(3, Math.floor(elapsed / 10) + 1);
          if (newWave !== wave) { wave = newWave; waveLabel.textContent = `Wave ${wave} · ${wave === 2 ? 'Snowball shuffle' : 'The golden flurry'}`; api.feedback(`Wave ${wave}! The workshop is getting livelier.`); }
          for (let i = 0; i < 9; i++) if (slots[i]) {
            slots[i].remaining -= dt;
            if (slots[i].remaining <= 0) { if (slots[i].kind !== 'snowman') { missed++; state.streak = 0; } setSlot(i, null); }
          }
          const interval = cosy ? .95 - wave * .08 : .8 - wave * .1;
          if (spawn >= interval) {
            spawn = 0;
            const empty = slots.map((s, i) => s ? -1 : i).filter(i => i !== -1);
            if (empty.length) {
              const roll = spawned++ === 0 ? 0 : randomInt(100);
              setSlot(empty[randomInt(empty.length)], { kind: roll < 70 ? 'elf' : roll < 88 ? 'gold' : 'snowman', remaining: (cosy ? 2.5 : 1.8) - wave * .2 });
            }
          }
          update();
          if (elapsed >= 30) { finish(); return; }
        }
        g.frame(tick);
      };
      update(); g.frame(tick); buttons[0].focus();
    }
  }

  function skyGame(g) {
    const delivery = kind === 'delivery';
    g.title(delivery ? 'SANTA’S SKY ROUTE' : 'THE SNOWFLAKE FESTIVAL', delivery ? 'Special delivery, straight from the sleigh' : 'Catch a little winter magic', delivery ? 'Line up your sleigh beneath the glowing house, then launch a present. Avoid storm clouds — they can intercept your parcel. The next delivery lights up after a successful drop.' : 'Catch snowflakes in your basket. Golden stars are worth triple; dodge the storm clouds! Build a catching streak as the snowfall gets faster.');
    g.el('p', delivery ? 'Move with arrows, A/D, pointer or the big direction buttons. Space / Deliver launches a parcel. 30 seconds.' : 'Move with arrows, A/D, pointer or the big direction buttons. 30 seconds. Every three catches increase your multiplier.', root, 'small game-help');
    const start = g.button('Start', () => { start.remove(); play(); }, root, 'gold');
    function play() {
      g.playing();
      let score = 0, streak = 0, best = 0, caught = 0, hazards = 0, delivered = 0, x = .5, elapsed = 0, last = 0, spawn = 0, paused = false, finished = false, cooldown = 0, destination = randomInt(3);
      let objects = [], parcels = [], snowSpawned = 0;
      const held = new Set();
      const [points, clock, combo] = g.hud(['Score', 'Time', delivery ? 'Delivered' : 'Streak']);
      const bar = g.meter('Round time remaining', 30, 30);
      const stage = g.el('div', undefined, root, 'game-stage sky-stage');
      stage.tabIndex = 0; stage.setAttribute('aria-label', delivery ? 'Sleigh route. Use left/right arrows to move, Space to deliver.' : 'Snowflake field. Use left/right arrows to move.');
      const hint = g.el('p', '', root, 'route-hint');
      const houses = delivery ? [.18, .5, .82].map((position, i) => { const h = g.el('div', undefined, stage, 'delivery-house'); g.el('span', '🏠', h); g.el('span', String(i + 1), h, 'house-number'); h.style.left = `${position * 100}%`; return h; }) : [];
      const player = g.el('div', delivery ? '🛷' : '🧺', stage, 'sky-player');
      const update = () => {
        player.style.left = `${x * 100}%`; points.textContent = score; clock.textContent = `${Math.max(0, Math.ceil(30 - elapsed))}s`; combo.textContent = delivery ? delivered : `${streak} · ×${Math.min(3, 1 + Math.floor(streak / 3))}`; bar.value = Math.max(0, 30 - elapsed);
        if (delivery) { houses.forEach((h, i) => h.classList.toggle('destination', i === destination)); hint.textContent = `Deliver to house ${destination + 1} · ${x < [.18, .5, .82][destination] - .09 ? 'Move right →' : x > [.18, .5, .82][destination] + .09 ? '← Move left' : 'Aligned — launch your present!'}`; }
        else hint.textContent = `Best streak ${best} · Golden stars ×3 · Clouds −10`;
      };
      const deliver = () => {
        if (!delivery || paused || finished || cooldown > 0) return;
        cooldown = .35;
        const parcel = { x, y: .83, el: g.el('span', '🎁', stage, 'sky-object parcel') };
        parcel.el.style.left = `${x * 100}%`; parcels.push(parcel); api.cue?.('button');
      };
      const controls = g.el('div', undefined, root, 'game-controls');
      const move = delta => { if (!paused && !finished) { x = Math.max(.07, Math.min(.93, x + delta)); update(); } };
      const left = g.button('← Left', () => move(-.08), controls);
      const right = g.button('Right →', () => move(.08), controls);
      const launch = delivery ? g.button('Deliver · Space', deliver, controls, 'gold') : null;
      const pause = g.button('Pause', () => { paused = !paused; pause.textContent = paused ? 'Resume' : 'Pause'; held.clear(); stage.classList.toggle('game-paused', paused); if (launch) launch.disabled = paused; }, controls);
      const keys = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
      g.listen(root, 'keydown', e => {
        if (keys[e.key]) { e.preventDefault(); held.add(keys[e.key]); }
        if (delivery && e.key === ' ' && !e.repeat && (e.target === stage || e.target === launch)) { e.preventDefault(); deliver(); }
      });
      g.listen(document, 'keyup', e => { if (keys[e.key]) held.delete(keys[e.key]); });
      g.listen(window, 'blur', () => held.clear());
      g.listen(document, 'visibilitychange', () => { if (document.hidden) held.clear(); });
      for (const [b, direction] of [[left, 'left'], [right, 'right']]) {
        g.listen(b, 'pointerdown', e => { held.add(direction); b.setPointerCapture(e.pointerId); });
        for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) g.listen(b, event, () => held.delete(direction));
      }
      const point = e => { if (paused || finished) return; const bounds = stage.getBoundingClientRect(); x = Math.max(.07, Math.min(.93, (e.clientX - bounds.left) / bounds.width)); update(); };
      g.listen(stage, 'pointerdown', e => { stage.setPointerCapture(e.pointerId); point(e); stage.focus(); });
      g.listen(stage, 'pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) point(e); });
      const finish = () => {
        finished = true; held.clear(); controls.querySelectorAll('button').forEach(b => b.disabled = true);
        objects.forEach(o => o.el.remove()); parcels.forEach(o => o.el.remove());
        g.result({ score, heading: delivery ? 'Special delivery complete!' : 'A basket full of Christmas!', detail: delivery ? 'Warm windows, happy homes, and one very busy sleigh. Can you improve your route?' : 'A little snow, a little sparkle — a lovely winter adventure.', stats: [delivery ? `${delivered} presents delivered · ${hazards} storms hit` : `${caught} catches · Best streak ${best} · ${hazards} clouds caught`], restart: again });
      };
      const remove = (list, object) => { object.el.remove(); const i = list.indexOf(object); if (i >= 0) list.splice(i, 1); };
      const tick = now => {
        if (finished) return;
        const dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
        if (!paused && !document.hidden) {
          elapsed += dt; cooldown = Math.max(0, cooldown - dt); spawn += dt;
          if (held.has('left')) x -= dt * .65;
          if (held.has('right')) x += dt * .65;
          x = Math.max(.07, Math.min(.93, x));
          if (spawn > (delivery ? 1.1 : Math.max(.35, .8 - elapsed / 90))) {
            spawn = 0;
            const roll = snowSpawned++ === 0 ? 0 : randomInt(100), type = delivery || roll > 82 ? 'cloud' : roll > 65 ? 'gold' : 'snow';
            const o = { x: .08 + randomInt(84) / 100, y: delivery ? .22 : -.05, kind: type, el: g.el('span', type === 'cloud' ? '☁️' : type === 'gold' ? '⭐' : '❄️', stage, 'sky-object') };
            o.el.style.left = `${o.x * 100}%`; objects.push(o);
          }
          for (const o of [...objects]) {
            o.y += dt * (delivery ? .15 : .23 + elapsed / 180);
            o.el.style.top = `${o.y * 100}%`;
            if (o.y >= .82 && o.y <= .94 && Math.abs(o.x - x) < .12) {
              if (o.kind === 'cloud') { score = Math.max(0, score - 10); streak = 0; hazards++; api.feedback('Storm cloud! −10. A fresh streak starts with the next catch.'); }
              else { streak++; caught++; best = Math.max(best, streak); const gain = (o.kind === 'gold' ? 15 : 5) * Math.min(3, 1 + Math.floor((streak - 1) / 3)); score += gain; api.feedback(`${o.kind === 'gold' ? 'Golden sparkle!' : 'Snowflake caught!'} +${gain}`); api.cue?.('button'); }
              remove(objects, o);
            } else if (o.y > 1.05) { if (o.kind !== 'cloud') streak = 0; remove(objects, o); }
          }
          for (const parcel of [...parcels]) {
            parcel.y -= dt * .9; parcel.el.style.top = `${parcel.y * 100}%`;
            const cloud = objects.find(o => Math.abs(o.x - parcel.x) < .09 && Math.abs(o.y - parcel.y) < .07);
            if (cloud) { remove(parcels, parcel); remove(objects, cloud); streak = 0; api.feedback('A cloud intercepted that present! Try a clearer route.'); }
            else if (parcel.y <= .2) {
              if (Math.abs(parcel.x - [.18, .5, .82][destination]) < .12) { delivered++; streak++; score += 20 + Math.min(20, streak * 2); api.feedback(`Delivered to house ${destination + 1}! ${streak > 1 ? `${streak} delivery streak!` : ''}`); destination = (destination + 1 + randomInt(2)) % 3; api.cue?.('success'); }
              else { streak = 0; api.feedback('That house is not expecting this parcel. Follow the glowing window.'); }
              remove(parcels, parcel);
            }
          }
          update(); if (elapsed >= 30) { finish(); return; }
        }
        g.frame(tick);
      };
      update(); g.frame(tick); stage.focus();
    }
  }
  again();
  return () => game?.dispose();
}
