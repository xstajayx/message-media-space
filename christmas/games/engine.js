// A game owns its timers, animation loop and listeners. Closing or restarting disposes them.
export function createGame(root, api) {
  root.classList.remove('is-playing', 'is-finished');
  let active = true;
  const disposers = [];
  const timers = new Set();
  const frames = new Set();
  const el = (tag, text, parent = root, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    parent.append(element);
    return element;
  };
  const listen = (element, event, fn, options) => {
    element.addEventListener(event, fn, options);
    disposers.push(() => element.removeEventListener(event, fn, options));
  };
  const button = (text, fn, parent = root, className) => {
    const b = el('button', text, parent, className);
    b.type = 'button';
    listen(b, 'click', fn);
    return b;
  };
  const arm = timer => {
    timer.due = performance.now() + timer.remaining;
    timer.id = setTimeout(() => {
      timers.delete(timer);
      if (active) timer.fn();
    }, timer.remaining);
  };
  const later = (fn, ms) => {
    const timer = { fn, remaining: ms, due: 0, id: null };
    timers.add(timer);
    if (!document.hidden) arm(timer);
    return timer;
  };
  listen(document, 'visibilitychange', () => {
    for (const timer of timers) {
      if (document.hidden) {
        clearTimeout(timer.id);
        timer.remaining = Math.max(0, timer.due - performance.now());
      } else arm(timer);
    }
  });
  const frame = fn => {
    const id = requestAnimationFrame(now => { frames.delete(id); if (active) fn(now); });
    frames.add(id);
  };
  const dispose = () => {
    active = false;
    timers.forEach(timer => clearTimeout(timer.id));
    frames.forEach(cancelAnimationFrame);
    disposers.forEach(fn => fn());
  };
  const meter = (label, max, value = 0, parent = root) => {
    const wrap = el('label', label, parent, 'game-meter');
    const bar = el('progress', undefined, wrap);
    bar.max = max; bar.value = value;
    bar.setAttribute('aria-label', label);
    return bar;
  };
  const hud = labels => {
    const wrap = el('div', undefined, root, 'game-hud');
    return labels.map(label => {
      const cell = el('div', undefined, wrap);
      el('span', label, cell);
      return el('strong', '0', cell);
    });
  };
  const playing = () => root.classList.add('is-playing');
  const title = (kicker, heading, description) => {
    const intro = el('div', undefined, root, 'game-intro');
    el('p', kicker, intro, 'eyebrow');
    el('h3', heading, intro, 'game-heading');
    el('p', description, intro);
    if (!api.demo && api.bestScore > 0) el('p', `Your best: ${api.bestScore} points · Can you beat it?`, intro, 'personal-best');
  };
  const scoreStars = score => score >= 200 ? 3 : score >= 80 ? 2 : score > 0 ? 1 : 0;
  const result = ({ score, heading, detail, stats = [], restart, stars = scoreStars(score) }) => {
    root.classList.add('is-finished');
    const panel = el('section', undefined, root, 'game-result');
    panel.tabIndex = -1;
    el('div', stars >= 3 ? '🏆' : stars >= 2 ? '🥈' : stars ? '🥉' : '❄', panel, 'result-medal');
    el('p', stars >= 3 ? 'CHRISTMAS CHAMPION' : stars >= 2 ? 'FESTIVE HERO' : 'KEEP THE MAGIC GOING', panel, 'eyebrow');
    el('h3', heading, panel);
    el('strong', `${score} points`, panel, 'result-score');
    el('p', detail, panel);
    stats.forEach(text => el('p', text, panel, 'small'));
    if (score > 0 && stars > 0) api.complete(score, stars);
    api.feedback(api.demo ? 'Demo complete — family stars are unchanged.' : score > 0 ? 'Best score saved. Replay to beat it; stars are awarded once per activity.' : 'Try another round — every great elf starts somewhere.');
    button('Play again', restart, panel, 'gold');
    panel.focus();
    return panel;
  };
  return { el, button, listen, later, frame, dispose, meter, hud, title, playing, result };
}

// Pure scoring rules shared by the games and regression tests.
export function targetShot(state, kind) {
  const shots = state.shots + 1;
  if (kind === 'snowman' || kind === 'empty') return { ...state, shots, streak: 0, score: Math.max(0, state.score - (kind === 'snowman' ? 15 : 0)) };
  const streak = state.streak + 1;
  const multiplier = Math.min(4, 1 + Math.floor((streak - 1) / 3));
  const gained = (kind === 'gold' ? 20 : 10) * multiplier;
  return { ...state, shots, hits: state.hits + 1, streak, best: Math.max(state.best, streak), score: state.score + gained };
}
export function stackOverlap(movingX, movingWidth, baseX, baseWidth) {
  const left = Math.max(movingX, baseX);
  const right = Math.min(movingX + movingWidth, baseX + baseWidth);
  return { x: left, width: Math.max(0, right - left) };
}
export function sortScore(correct, streak) { return correct ? 10 + Math.min(20, streak * 2) : 0; }
