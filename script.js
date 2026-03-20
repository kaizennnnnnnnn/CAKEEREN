/* ============================================================
   Mirabelle — Artisan Cakery · Interactions
   taste-skill: MOTION_INTENSITY 6 — fluid, purposeful
   ============================================================ */

'use strict';

/* ── Scroll-triggered reveal ────────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal, .reveal-up, .reveal-right');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      // Stagger siblings in the same parent container
      const parent   = entry.target.parentElement;
      const siblings = Array.from(
        parent.querySelectorAll('.reveal, .reveal-up, .reveal-right')
      );
      const idx = siblings.indexOf(entry.target);

      entry.target.style.transitionDelay = `${idx * 0.07}s`;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
);

revealEls.forEach((el) => revealObserver.observe(el));

/* ── Hero entrance (no wait for scroll) ────────────────────── */
window.addEventListener('load', () => {
  const heroRevealEls = document.querySelectorAll(
    '.hero .reveal, .hero .reveal-up, .hero .reveal-right'
  );
  heroRevealEls.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('visible');
    }, 180 + i * 110);
  });
});

/* ── Navigation — scroll state ─────────────────────────────── */
const nav = document.getElementById('nav');

window.addEventListener(
  'scroll',
  () => {
    nav.classList.toggle('scrolled', window.scrollY > 72);
  },
  { passive: true }
);

/* ── Hero parallax ──────────────────────────────────────────── */
const heroRight = document.querySelector('.hero-right');

window.addEventListener(
  'scroll',
  () => {
    if (!heroRight) return;
    const y = window.scrollY;
    if (y < window.innerHeight * 1.2) {
      heroRight.style.transform = `translateY(${y * 0.07}px)`;
    }
  },
  { passive: true }
);

/* ── Magnetic buttons ───────────────────────────────────────── */
const magneticBtns = document.querySelectorAll('.magnetic-btn');

magneticBtns.forEach((btn) => {
  let animFrame;

  btn.addEventListener('mouseenter', () => {
    btn.style.transition = 'transform 0.08s ease';
  });

  btn.addEventListener('mousemove', (e) => {
    cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(() => {
      const rect     = btn.getBoundingClientRect();
      const x        = e.clientX - rect.left - rect.width  / 2;
      const y        = e.clientY - rect.top  - rect.height / 2;
      const strength = 0.32;
      btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
  });

  btn.addEventListener('mouseleave', () => {
    cancelAnimationFrame(animFrame);
    btn.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    btn.style.transform  = 'translate(0, 0)';
  });
});

/* ── Smooth anchor scroll ───────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href   = anchor.getAttribute('href');
    const target = href === '#' ? null : document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ── Bento card — subtle tilt on hover ─────────────────────── */
const bentoCards = document.querySelectorAll('.bento-card');

bentoCards.forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect   = card.getBoundingClientRect();
    const cx     = e.clientX - rect.left  - rect.width  / 2;
    const cy     = e.clientY - rect.top   - rect.height / 2;
    const rotX   = (-cy / rect.height) * 5;
    const rotY   = ( cx / rect.width ) * 5;
    card.style.transition = 'transform 0.1s ease';
    card.style.transform  = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    card.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
  });
});

/* ── Pet section — play-to-target scrubber ───────────────────── */
const petsSection  = document.querySelector('.pets-scroll');
const petsVideo    = document.getElementById('petsVideo');
const petsPanels   = document.querySelectorAll('.pets-panel');
const petsDots     = document.querySelectorAll('.pets-dot');
const petsProgress = document.getElementById('petsProgressFill');

let petsReady      = false;
let petsTargetProg = 0;
let petsRafId      = null;
let petsActive     = false;  // true only while section is on screen
let petsLastIdx    = -1;

if (petsVideo) {
  petsVideo.pause();
  petsVideo.addEventListener('loadedmetadata', () => { petsReady = true; });
  petsVideo.addEventListener('canplaythrough',  () => { petsReady = true; });
  petsVideo.load();
}

function calcPetsProgress() {
  if (!petsSection) return 0;
  const rect    = petsSection.getBoundingClientRect();
  const total   = petsSection.offsetHeight - window.innerHeight;
  return Math.max(0, Math.min(1, -rect.top / total));
}

/* Continuous rAF loop — only runs while section is visible */
function petsLoop() {
  if (!petsActive) { petsRafId = null; return; }
  petsRafId = requestAnimationFrame(petsLoop);

  if (!petsReady || !petsVideo.duration) return;

  const target  = petsTargetProg * petsVideo.duration;
  const current = petsVideo.currentTime;
  const diff    = target - current;

  if (diff > 0.06) {
    /* ── Scrolling forward: use play() — hardware-accelerated ── */
    const rate = Math.min(diff * 6, 12);
    if (petsVideo.playbackRate !== rate) petsVideo.playbackRate = rate;
    if (petsVideo.paused) petsVideo.play().catch(() => {});
  } else if (diff < -0.06) {
    /* ── Scrolling backward: one seek, then stop ── */
    petsVideo.pause();
    if (petsVideo.fastSeek) petsVideo.fastSeek(target);
    else petsVideo.currentTime = target;
  } else {
    /* ── At target: hold ── */
    if (!petsVideo.paused) petsVideo.pause();
  }

  /* UI — only write when something changed */
  const p   = petsTargetProg;
  const idx = p >= 1 ? 4 : Math.floor(p * 5);

  if (petsProgress) petsProgress.style.transform = `scaleX(${p})`;

  if (idx !== petsLastIdx) {
    petsPanels.forEach((el, i) => el.classList.toggle('active', i === idx));
    petsDots.forEach(  (el, i) => el.classList.toggle('active', i === idx));
    petsLastIdx = idx;
  }
}

/* Scroll handler — pure maths only, no DOM */
window.addEventListener('scroll', () => {
  petsTargetProg = calcPetsProgress();
}, { passive: true });

/* Start / stop the loop based on section visibility */
if (petsSection) {
  new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      petsActive = e.isIntersecting;
      if (petsActive && !petsRafId) {
        petsRafId = requestAnimationFrame(petsLoop);
      } else if (!petsActive) {
        petsVideo.pause();
      }
    });
  }, { threshold: 0 }).observe(petsSection);

  /* Hide nav only when the sticky video panel fully fills the viewport */
  const petsSticky = petsSection.querySelector('.pets-sticky');
  if (petsSticky) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        nav.classList.toggle('nav-hidden', e.isIntersecting);
      });
    }, { threshold: 0.98 }).observe(petsSticky);
  }
}

petsTargetProg = calcPetsProgress();

/* ── Mobile nav — hamburger toggle ─────────────────────────── */
const hamburger  = document.getElementById('navHamburger');
const mobileNav  = document.getElementById('navMobile');
const mobileClose = document.getElementById('navMobileClose');

function closeMobileNav() {
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileNav.classList.remove('open');
  mobileNav.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileNav.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileClose.addEventListener('click', closeMobileNav);

  mobileNav.querySelectorAll('.nav-mobile-link').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });
}

/* ── Marquee — pause on hover ───────────────────────────────── */
const marqueeTrack = document.querySelector('.marquee-track');

if (marqueeTrack) {
  marqueeTrack.parentElement.addEventListener('mouseenter', () => {
    marqueeTrack.style.animationPlayState = 'paused';
  });
  marqueeTrack.parentElement.addEventListener('mouseleave', () => {
    marqueeTrack.style.animationPlayState = 'running';
  });
}
