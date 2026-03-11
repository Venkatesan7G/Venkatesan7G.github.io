// ── Active nav link ──
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === path) a.classList.add('active');
  });

  // ── Dark mode toggle ──
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;

  try {
    const saved = sessionStorage.getItem('theme');
    if (saved) root.setAttribute('data-theme', saved);
  } catch(e) {}

  function updateToggleLabel() {
    if (!btn) return;
    const isDark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    btn.textContent = isDark ? '○ light' : '● dark';
  }
  updateToggleLabel();

  if (btn) {
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let next;
      if (!current) {
        next = systemDark ? 'light' : 'dark';
      } else if (current === 'dark') {
        next = 'light';
      } else {
        next = 'dark';
      }
      root.setAttribute('data-theme', next);
      try { sessionStorage.setItem('theme', next); } catch(e) {}
      updateToggleLabel();
    });
  }

  // ── Easter egg: Konami code ──
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiIdx = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key === KONAMI[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === KONAMI.length) {
        konamiIdx = 0;
        showEasterEgg();
      }
    } else {
      konamiIdx = 0;
    }
  });

  // Mobile: tap the footer name 5 times quickly
  let tapCount = 0; let tapTimer;
  const footerName = document.querySelector('.footer-name');
  if (footerName) {
    footerName.style.cursor = 'pointer';
    footerName.addEventListener('click', () => {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 1500);
      if (tapCount >= 5) { tapCount = 0; showEasterEgg(); }
    });
  }

  const overlay = document.getElementById('konami-overlay');
  const closeBtn = document.getElementById('konami-close');
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay) overlay.classList.remove('active'); });

  function showEasterEgg() {
    if (overlay) overlay.classList.add('active');
  }
});
