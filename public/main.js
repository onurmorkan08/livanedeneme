(function () {
  'use strict';

  // ── CURSOR ──────────────────────────────────
  var cursor = document.getElementById('cursor');
  var follower = document.getElementById('cursor-follower');
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canUseCursor = !!(cursor && follower && finePointer && !reduceMotion);

  document.documentElement.classList.toggle('custom-cursor-active', canUseCursor);

  if (canUseCursor) {
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var followX = mouseX;
    var followY = mouseY;
    var cursorVisible = false;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0) translate3d(-50%,-50%,0)';
      if (!cursorVisible) {
        cursor.classList.add('is-visible');
        follower.classList.add('is-visible');
        cursorVisible = true;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      cursor.classList.remove('is-visible');
      follower.classList.remove('is-visible');
      cursorVisible = false;
    });

    function animFollower() {
      followX += (mouseX - followX) * 0.14;
      followY += (mouseY - followY) * 0.14;
      follower.style.transform = 'translate3d(' + followX + 'px,' + followY + 'px,0) translate3d(-50%,-50%,0)';
      requestAnimationFrame(animFollower);
    }
    animFollower();

    document.querySelectorAll('a,button,[data-magnetic]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('hovered');
        follower.classList.add('hovered');
      });
      el.addEventListener('mouseleave', function () {
        cursor.classList.remove('hovered');
        follower.classList.remove('hovered');
      });
    });
  }
  // ── PAGE LOADER ──────────────────────────────
  var loader = document.getElementById('page-loader');
  var progress = document.getElementById('loader-progress');
  var pct = 0;

  if (loader && progress) {
    var loaderInterval = setInterval(function () {
      pct += Math.random() * 18;
      if (pct >= 100) {
        pct = 100;
        clearInterval(loaderInterval);
        progress.style.width = '100%';
        setTimeout(function () {
          loader.classList.add('done');
          triggerReveal();
        }, 400);
      }
      progress.style.width = Math.min(pct, 95) + '%';
    }, 80);
  } else {
    window.requestAnimationFrame(triggerReveal);
  }

  // ── NAV ─────────────────────────────────────
  var navHeader = document.getElementById('nav-header');
  if (navHeader) {
    window.addEventListener('scroll', function () {
      navHeader.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // Mobile nav
  var burger = document.getElementById('nav-burger');
  var mobNav = document.getElementById('mob-nav');
  var mobClose = document.getElementById('mob-close');
  var mobOverlay = document.getElementById('mob-overlay');

  function openNav() { mobNav.classList.add('open'); mobOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeNav() { mobNav.classList.remove('open'); mobOverlay.classList.remove('open'); document.body.style.overflow = ''; }

  if (burger && mobNav && mobClose && mobOverlay) {
    burger.addEventListener('click', openNav);
    mobClose.addEventListener('click', closeNav);
    mobOverlay.addEventListener('click', closeNav);
  }
  document.querySelectorAll('.mob-link').forEach(function (l) { l.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mobNav && mobNav.classList.contains('open')) closeNav(); });

  // ── SCROLL REVEAL ────────────────────────────
  var revealEls = document.querySelectorAll('.reveal-up,.reveal-fade,.reveal-line');

  function triggerReveal() {
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        el.classList.add('in');
      }
    });
  }

  window.addEventListener('scroll', triggerReveal, { passive: true });
  window.addEventListener('resize', triggerReveal, { passive: true });

  // ── PARTICLES ───────────────────────────────
  var particleContainer = document.getElementById('hero-particles');
  if (particleContainer) {
    for (var i = 0; i < 28; i++) {
      (function (idx) {
        var p = document.createElement('div');
        var size = Math.random() * 2 + 1;
        var x = Math.random() * 100;
        var y = Math.random() * 100;
        var dur = Math.random() * 10 + 8;
        var delay = Math.random() * 6;
        p.style.cssText = [
          'position:absolute',
          'left:' + x + '%',
          'top:' + y + '%',
          'width:' + size + 'px',
          'height:' + size + 'px',
          'border-radius:50%',
          'background:rgba(0,212,255,' + (Math.random() * 0.3 + 0.1) + ')',
          'animation:float' + (idx % 3) + ' ' + dur + 's ease-in-out ' + delay + 's infinite',
          'pointer-events:none'
        ].join(';');
        particleContainer.appendChild(p);
      })(i);
    }

    var style = document.createElement('style');
    style.textContent = [
      '@keyframes float0{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(12px,-15px) scale(1.2)}66%{transform:translate(-8px,8px) scale(.8)}}',
      '@keyframes float1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-14px,-20px) scale(1.3)}}',
      '@keyframes float2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(10px,12px) scale(.9)}80%{transform:translate(-12px,-8px) scale(1.1)}}'
    ].join('');
    document.head.appendChild(style);
  }

  // ── HERO PARALLAX ────────────────────────────
  var heroImg = document.getElementById('hero-img');
  window.addEventListener('scroll', function () {
    if (!heroImg || window.scrollY > window.innerHeight) return;
    heroImg.style.transform = 'scale(1.05) translateY(' + window.scrollY * 0.1 + 'px)';
  }, { passive: true });

  // ── BEFORE/AFTER SLIDER ──────────────────────
  var baContainer = document.getElementById('ba-container');
  var baAfter = document.querySelector('.ba-after');
  var baHandle = document.getElementById('ba-handle-line');

  if (baContainer && baAfter && baHandle) {
    var dragging = false;

    function setBA(pct) {
      pct = Math.max(3, Math.min(97, pct));
      baAfter.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      baHandle.style.left = pct + '%';
    }

    function getXPct(clientX) {
      var r = baContainer.getBoundingClientRect();
      return ((clientX - r.left) / r.width) * 100;
    }

    baHandle.addEventListener('mousedown', function (e) { dragging = true; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (dragging) setBA(getXPct(e.clientX)); });
    window.addEventListener('mouseup', function () { dragging = false; });
    baHandle.addEventListener('touchstart', function (e) { dragging = true; }, { passive: true });
    window.addEventListener('touchmove', function (e) { if (dragging && e.touches[0]) setBA(getXPct(e.touches[0].clientX)); }, { passive: true });
    window.addEventListener('touchend', function () { dragging = false; });

    // Animate on reveal
    var baObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        animateBA();
        baObs.disconnect();
      }
    }, { threshold: 0.4 });
    baObs.observe(baContainer);

    function animateBA() {
      var start = null;
      var from = 100, to = 50, dur = 1400;
      function step(ts) {
        if (!start) start = ts;
        var prog = Math.min((ts - start) / dur, 1);
        var e = 1 - Math.pow(1 - prog, 3);
        setBA(from + (to - from) * e);
        if (prog < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  }

  // ── SMOOTH ANCHOR SCROLL ─────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  // ── MAGNETIC BUTTONS ─────────────────────────
  document.querySelectorAll('[data-magnetic]').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.18;
      var y = (e.clientY - r.top - r.height / 2) * 0.18;
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
    });
  });

  // ── SERVICE ITEM 3D TILT ─────────────────────
  document.querySelectorAll('.svc-content-col,.val-card,.partner-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width - 0.5) * 5;
      var y = ((e.clientY - r.top) / r.height - 0.5) * 5;
      card.style.transform = 'translateY(-4px) rotateX(' + (-y) + 'deg) rotateY(' + x + 'deg)';
    });
    card.addEventListener('mouseleave', function () { card.style.transform = ''; });
  });

  // ── COUNTER ANIMATION ────────────────────────
  function animCounter(el, target) {
    var start = null, dur = 1500;
    function step(ts) {
      if (!start) start = ts;
      var prog = Math.min((ts - start) / dur, 1);
      var e = 1 - Math.pow(1 - prog, 3);
      el.textContent = Math.round(target * e);
      if (prog < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counterEls = document.querySelectorAll('.counter[data-target]');
  var counterObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animCounter(entry.target, parseInt(entry.target.dataset.target));
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counterEls.forEach(function (el) { counterObs.observe(el); });

  // ── MARQUEE PAUSE ON HOVER ───────────────────
  var marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    marqueeTrack.parentElement.addEventListener('mouseenter', function () {
      marqueeTrack.style.animationPlayState = 'paused';
    });
    marqueeTrack.parentElement.addEventListener('mouseleave', function () {
      marqueeTrack.style.animationPlayState = 'running';
    });
  }

  // ── FOOTER YEAR ──────────────────────────────
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // ── MAP DOTS STAGGER ─────────────────────────
  document.querySelectorAll('.map-ping').forEach(function (p, i) {
    p.querySelector('.ping-ring').style.animationDelay = (i * 0.8) + 's';
  });

  // ── SECTION HEADER STICKY HIGHLIGHT ──────────
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', function () {
    var scrollPos = window.scrollY + 120;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos && sec.offsetTop + sec.offsetHeight > scrollPos) {
        var id = sec.getAttribute('id');
        navLinks.forEach(function (link) {
          link.style.color = link.getAttribute('href') === '#' + id ? 'var(--white)' : '';
        });
      }
    });
  }, { passive: true });

  // ── BUYER CHIP CLICK PULSE ───────────────────
  document.querySelectorAll('.buyer-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      chip.style.borderColor = 'var(--cyan)';
      chip.style.color = 'var(--cyan)';
      chip.style.background = 'var(--cyan-dim)';
      setTimeout(function () {
        chip.style.borderColor = '';
        chip.style.color = '';
        chip.style.background = '';
      }, 700);
    });
  });

})();
