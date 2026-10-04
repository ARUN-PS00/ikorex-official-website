// --- Preloader (Home Page Only, once per browser session) ---
// The intro plays on the first visit of a session. Returning to the home page
// (back button, nav links, reloads) skips it: an inline <head> script adds
// .intro-seen to <html> before first paint so the overlay never flashes.
window.ikxIntroActive = false;
(function() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const INTRO_KEY = 'ikx-intro-seen';
  let seen = document.documentElement.classList.contains('intro-seen');
  try {
    seen = seen || sessionStorage.getItem(INTRO_KEY) === '1';
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch (e) { /* storage blocked: fall back to showing the intro */ }

  if (seen) {
    preloader.remove();
    return;
  }

  window.ikxIntroActive = true;

  // Restored from the back/forward cache: never replay the overlay
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && preloader.isConnected) preloader.remove();
  });

  const progressLine = preloader.querySelector('.loader-progress-line');
  const progressSteps = [15, 35, 55, 75, 90, 100];
  let currentStep = 0;
  let pageLoaded = false;
  let finishTriggered = false;

  if (progressLine) {
    progressLine.style.animation = 'none';
    progressLine.style.left = '-100%';
    progressLine.style.transition = 'left 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)';
  }

  function triggerFadeOut() {
    if (finishTriggered) return;
    finishTriggered = true;

    if (progressLine) progressLine.style.left = '0%';

    setTimeout(() => {
      preloader.classList.add('fade-out');
      window.ikxIntroActive = false;
      document.dispatchEvent(new Event('ikx:intro-done'));
      setTimeout(() => preloader.remove(), 900);
    }, 300);
  }

  function runLoader() {
    if (currentStep >= progressSteps.length - 1) {
      if (pageLoaded) triggerFadeOut();
      return;
    }
    if (progressLine) {
      progressLine.style.left = `${-100 + progressSteps[currentStep]}%`;
    }
    currentStep++;
    setTimeout(runLoader, 160 + Math.random() * 180);
  }

  if (document.readyState === 'complete') {
    pageLoaded = true;
  } else {
    window.addEventListener('load', () => {
      pageLoaded = true;
      if (currentStep >= progressSteps.length - 1) triggerFadeOut();
    });
  }

  setTimeout(runLoader, 120);

  // Fail-safe: never hold the visitor longer than 3.5 seconds
  setTimeout(triggerFadeOut, 3500);
})();

document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem('theme');
  } catch (e) {
    console.warn('LocalStorage is blocked or disabled in this environment:', e);
  }
  
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-theme');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      try {
        if (document.body.classList.contains('dark-theme')) {
          localStorage.setItem('theme', 'dark');
        } else {
          localStorage.setItem('theme', 'light');
        }
      } catch (e) {
        console.warn('Could not save theme preference to localStorage:', e);
      }
    });
  }

  // --- 1. Mobile Navigation Toggle ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');

  function setMenu(open) {
    if (!mobileMenuBtn || !navLinks) return;
    navLinks.classList.toggle('active', open);
    mobileMenuBtn.setAttribute('aria-expanded', String(open));
    mobileMenuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setMenu(!navLinks.classList.contains('active'));
    });
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !navLinks.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  // --- 2. Liquid Glass Light Tracking ---
  // Moves the specular highlight on glass panels to follow the pointer
  const GLASS_SELECTOR = '.glass, .diagnosis-card, .comparison-card, .risk-card, .capability-card, ' +
    '.stat-card-compact, .cta-card, .engine-card, .solution-horizontal-card, .premium-value-card, ' +
    '.founders-panel, .contact-info-card, .contact-form-card, .blog-card, .trust-bar, .value-row, ' +
    '.team-card, .process-step, .sidebar-widget, .article-bento-item, .privacy-contact-card';

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('pointermove', (e) => {
      const panel = e.target.closest && e.target.closest(GLASS_SELECTOR);
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      panel.style.setProperty('--my', `${e.clientY - rect.top}px`);
    }, { passive: true });
  }

  // --- 3. Interactive Automation Console Simulation ---
  const consoleTimer = document.getElementById('consoleTimer');
  const consoleRow1 = document.getElementById('consoleRow1');
  const consoleCheckRow1 = consoleRow1 ? consoleRow1.querySelector('.console-check-icon') : null;

  const consoleQueue = document.getElementById('consoleQueue');
  const consoleQueueCheck = document.getElementById('consoleQueueCheck');

  // Simulated Processing States for Invoice Batch (Row 1)
  let processingInterval;
  function startInvoiceSimulation() {
    if (!consoleTimer || !consoleCheckRow1) return;
    
    let time = 4.2;
    consoleCheckRow1.classList.remove('active');
    consoleTimer.style.color = 'var(--text-muted)';
    consoleTimer.textContent = '4.2s';
    
    // Simulate countdown processing
    clearInterval(processingInterval);
    processingInterval = setInterval(() => {
      time -= 0.1;
      if (time <= 0) {
        time = 0.0;
        clearInterval(processingInterval);
        consoleCheckRow1.classList.add('active');
        consoleTimer.style.color = 'var(--accent-green)';
        consoleTimer.textContent = '4.2s'; // Keep final duration
        
        // Wait 5 seconds and restart simulation loop
        setTimeout(startInvoiceSimulation, 5000);
      } else {
        consoleTimer.textContent = `${time.toFixed(1)}s`;
      }
    }, 100);
  }

  // Simulated Live Data Queue (Row 3)
  let queueInterval;
  function startQueueSimulation() {
    if (!consoleQueue || !consoleQueueCheck) return;

    let itemsPending = Math.floor(Math.random() * 40) + 50; // Random starting queue size
    consoleQueueCheck.classList.remove('active');
    consoleQueue.classList.remove('success');
    consoleQueue.classList.add('pending');
    consoleQueue.textContent = `${itemsPending} pending`;

    clearInterval(queueInterval);
    queueInterval = setInterval(() => {
      const processingStep = Math.floor(Math.random() * 5) + 3;
      itemsPending -= processingStep;

      if (itemsPending <= 0) {
        itemsPending = 0;
        clearInterval(queueInterval);
        consoleQueue.textContent = '0 pending';
        consoleQueue.classList.remove('pending');
        consoleQueue.classList.add('success');
        consoleQueue.textContent = '0 pending';
        consoleQueueCheck.classList.add('active');
        
        // Wait 8 seconds before refilling data entry queue
        setTimeout(startQueueSimulation, 8000);
      } else {
        consoleQueue.textContent = `${itemsPending} pending`;
      }
    }, 400);
  }

  // Simulate Live Fluctuation of Console Chart Bars
  const chartBars = document.querySelectorAll('.chart-bar');
  function fluctuateChart() {
    chartBars.forEach(bar => {
      const currentVal = parseInt(bar.style.getPropertyValue('--val')) || 50;
      // Fluctuate by +/- 15%
      const delta = Math.floor(Math.random() * 31) - 15;
      let newVal = currentVal + delta;
      if (newVal < 10) newVal = 10;
      if (newVal > 100) newVal = 100;
      bar.style.setProperty('--val', `${newVal}%`);
    });
  }

  // Start all console widgets
  startInvoiceSimulation();
  startQueueSimulation();
  setInterval(fluctuateChart, 1500);


  // --- 4. Scroll-Triggered Stat Counters ---
  const statNumbers = document.querySelectorAll('.stat-number');
  
  const countUp = (element) => {
    const targetString = element.getAttribute('data-target'); // e.g. "70" or "90"
    const targetNum = parseInt(targetString);
    let startNum = 0;
    
    // We want the text to look like: e.g. "50-70%" or "80-90%" during count up
    // Lower bound start points
    const lowerBound = targetNum === 70 ? 50 : 80; 
    let currentLower = 0;
    let currentUpper = 0;
    
    const duration = 2000; // 2 seconds
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;
    let frame = 0;
    
    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      
      // Easing out quadratic
      const easedProgress = progress * (2 - progress);
      
      currentLower = Math.floor(lowerBound * easedProgress);
      currentUpper = Math.floor(targetNum * easedProgress);
      
      element.textContent = `${currentLower}-${currentUpper}%`;
      
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = `${lowerBound}-${targetNum}%`;
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Intersection Observer to run counters when they scroll into view
  const observerOptions = {
    root: null,
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        countUp(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  statNumbers.forEach(num => {
    observer.observe(num);
  });

  // --- 5. Navigation Scroll Spy & Mobile Menu Close ---
  const sections = document.querySelectorAll('section, footer');
  const navLinksItems = document.querySelectorAll('.nav-links a');

  const isServicesPage = window.location.pathname.includes('services.html');
  const isSolutionsPage = window.location.pathname.includes('solutions.html');
  const isAboutPage = window.location.pathname.includes('about.html');
  const isContactPage = window.location.pathname.includes('contact.html');
  const isPrivacyPage = window.location.pathname.includes('privacy.html');

  function updateActiveLink() {
    if (isServicesPage || isSolutionsPage || isAboutPage || isContactPage || isPrivacyPage) return;
    
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 150; 

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 15) {
      currentSectionId = 'contact';
    }

    const sectionToNavLink = {
      'hero': '#hero',
      'diagnosis': '#diagnosis',
      'comparison': '#comparison',
      'risk-removed': '#comparison',
      'capabilities': '#capabilities',
      'contact': '#contact'
    };

    const targetHref = sectionToNavLink[currentSectionId];
    if (targetHref) {
      navLinksItems.forEach(link => {
        if (link.getAttribute('href') === targetHref) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  let spyTicking = false;
  window.addEventListener('scroll', () => {
    if (spyTicking) return;
    spyTicking = true;
    requestAnimationFrame(() => {
      updateActiveLink();
      spyTicking = false;
    });
  }, { passive: true });
  updateActiveLink();

  // Close mobile menu when any navigation link is clicked
  navLinksItems.forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });

  // --- Service Card Video Play / Pause Controls ---
  const mediaContainers = document.querySelectorAll('.engine-card-media');

  mediaContainers.forEach(container => {
    const video = container.querySelector('video');
    if (!video) return;

    container.classList.add('has-video');

    // Find or create play/pause button
    let playBtn = container.querySelector('.engine-video-play-btn');
    if (!playBtn) {
      playBtn = document.createElement('button');
      playBtn.className = 'engine-video-play-btn';
      playBtn.type = 'button';
      playBtn.setAttribute('aria-label', 'Toggle video playback');
      playBtn.innerHTML = `
        <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="6 3 20 12 6 21 6 3"></polygon>
        </svg>
        <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
          <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
        </svg>
      `;
      container.appendChild(playBtn);
    }

    // Find sound / mute button
    const muteBtn = container.querySelector('.engine-video-mute-btn');

    function updateState() {
      // Play / Pause UI state
      if (video.paused) {
        container.classList.remove('is-playing');
        container.classList.add('is-paused');
        playBtn.setAttribute('aria-label', 'Play video');
      } else {
        container.classList.remove('is-paused');
        container.classList.add('is-playing');
        playBtn.setAttribute('aria-label', 'Pause video');
      }

      // Audio Mute / Unmute UI state
      if (video.muted) {
        container.classList.remove('is-unmuted');
        container.classList.add('is-muted');
        if (muteBtn) muteBtn.setAttribute('aria-label', 'Unmute video');
      } else {
        container.classList.remove('is-muted');
        container.classList.add('is-unmuted');
        if (muteBtn) muteBtn.setAttribute('aria-label', 'Mute video');
      }
    }

    // Toggle playback function with auto-unmute on user play click
    function togglePlay(e) {
      if (e) e.stopPropagation();
      if (video.paused) {
        video.dataset.userPaused = 'false';
        // Auto-unmute when the user clicks play
        video.muted = false;
        video.play().catch(err => console.warn('Video play prevented:', err));
      } else {
        // If the video was playing muted from autoplay, clicking unmutes it
        if (video.muted) {
          video.muted = false;
        } else {
          video.dataset.userPaused = 'true';
          video.pause();
        }
      }
    }

    // Click on button or video container toggles playback
    playBtn.addEventListener('click', togglePlay);
    container.addEventListener('click', (e) => {
      // Don't trigger if clicked directly on play or mute button
      if (e.target.closest('.engine-video-play-btn') || e.target.closest('.engine-video-mute-btn')) return;
      togglePlay(e);
    });

    // Mute toggle button click
    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
      });
    }

    video.addEventListener('play', updateState);
    video.addEventListener('pause', updateState);
    video.addEventListener('ended', updateState);
    video.addEventListener('volumechange', updateState);

    // Initial state check
    updateState();

    // Auto-play / pause based on viewport intersection (respects manual user pause)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (video.dataset.userPaused !== 'true') {
              video.play().catch(() => {});
            }
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.25 });

      observer.observe(video);
    }
  });

  // --- Liquid colour field ---
  // Soft colour orbs spread down the page give the transparent glass panels
  // something to refract. They scroll with the content, so blur cost stays low.
  (function addLiquidOrbs() {
    if (document.querySelector('.liquid-orbs')) return;
    const field = document.createElement('div');
    field.className = 'liquid-orbs';
    field.setAttribute('aria-hidden', 'true');
    const palette = ['var(--orb-1)', 'var(--orb-2)', 'var(--orb-3)'];
    const spots = [[12, 6, 520], [88, 10, 440], [70, 24, 380], [8, 34, 460], [92, 46, 500],
      [30, 56, 420], [80, 66, 460], [15, 78, 520], [65, 88, 440], [40, 97, 480]];
    spots.forEach(([x, y, size], i) => {
      const orb = document.createElement('span');
      orb.className = 'liquid-orb';
      orb.style.cssText = `left:${x}%;top:${y}%;width:${size}px;height:${size}px;--orb-color:${palette[i % 3]}`;
      field.appendChild(orb);
    });
    document.body.prepend(field);
  })();

  // --- Liquid tab indicator: a glass pill that glides between tabs ---
  function initTabIndicator(container, activeSelector) {
    if (!container) return;
    const indicator = document.createElement('span');
    indicator.className = 'tab-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    container.prepend(indicator);
    container.classList.add('has-indicator');
    const tabs = () => Array.from(container.querySelectorAll(':scope > a'));
    const moveTo = (el) => {
      if (!el || el.offsetParent === null || getComputedStyle(container).flexDirection === 'column') {
        indicator.style.opacity = '0';
        return;
      }
      indicator.style.width = `${el.offsetWidth}px`;
      indicator.style.height = `${el.offsetHeight}px`;
      indicator.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
      indicator.style.opacity = '1';
    };
    const toActive = () => moveTo(container.querySelector(activeSelector));
    // First placement is instant so the pill doesn't slide in from the left on load
    const placeInstantly = () => {
      indicator.style.transition = 'none';
      toActive();
      void indicator.offsetWidth;
      indicator.style.transition = '';
    };
    tabs().forEach(a => a.addEventListener('mouseenter', () => moveTo(a)));
    container.addEventListener('mouseleave', toActive);
    window.addEventListener('resize', placeInstantly);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeInstantly);
    placeInstantly();
    return toActive;
  }

  const syncNavIndicator = initTabIndicator(document.querySelector('.nav-links'), ':scope > a.active');
  const syncSegIndicator = initTabIndicator(document.querySelector('.segmented-nav'), ':scope > a.active');
  window.addEventListener('scroll', () => {
    if (syncNavIndicator) requestAnimationFrame(syncNavIndicator);
    if (syncSegIndicator) requestAnimationFrame(syncSegIndicator);
  }, { passive: true });

  // --- Subtle 3D tilt on glass cards (fine pointers only) ---
  const TILT_SELECTOR = '.diagnosis-card, .risk-card, .capability-card, .engine-card, .value-row, ' +
    '.team-card, .process-step, .blog-card, .contact-info-card, .stat-card-compact';
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll(TILT_SELECTOR).forEach(card => {
      card.classList.add('tilt');
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--tilt-x', `${(-py * 4).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(px * 5).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  // --- Hero word rotator: cycles through the processes we automate ---
  const rotator = document.querySelector('[data-rotator]');
  if (rotator && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const words = Array.from(rotator.querySelectorAll('.hero-rotator-word'));
    let current = 0;
    setInterval(() => {
      if (document.hidden) return;
      const prev = words[current];
      current = (current + 1) % words.length;
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      words[current].classList.remove('is-leaving');
      words[current].classList.add('is-active');
      setTimeout(() => prev.classList.remove('is-leaving'), 650);
    }, 2400);
  }

  // --- Navbar: condense into a tighter glass pill once the page scrolls ---
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const syncNavbar = () => navbar.classList.toggle('is-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', syncNavbar, { passive: true });
    syncNavbar();
  }

  // --- Solutions page: highlight the segmented nav for the section in view ---
  const segLinks = document.querySelectorAll('.segmented-nav a[href^="#"]');
  if (segLinks.length && 'IntersectionObserver' in window) {
    const segObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        segLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    segLinks.forEach(a => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) segObserver.observe(target);
    });
  }

  // --- Scroll Reveal ---
  // Panels and headings rise into place as they enter the viewport, staggered
  // within each grid. Skipped entirely for reduced-motion users and old browsers.
  const REVEAL_SELECTOR = [
    '.hero-content > *', '.hero-visual', '.trust-bar',
    '.section-head > *', '.section-title', '.section-subtitle', '.custom-badge',
    '.page-title', '.page-lead', '.eyebrow', '.trust-stat', '.about-hero-copy .hero-actions', '.founders-panel',
    '.diagnosis-card', '.comparison-card', '.comparison-cta', '.risk-card', '.capability-card', '.stats-bento-card',
    '.blog-card', '.cta-card', '.engine-card', '.solution-horizontal-card', '.segmented-nav',
    '.value-row', '.team-card', '.process-step', '.about-story-copy > p',
    '.contact-info-card', '.contact-form-card', '.map-container', '.footnote'
  ].join(', ');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const all = new Set(Array.from(document.querySelectorAll(REVEAL_SELECTOR))
      .filter(el => !el.closest('#preloader, .navbar, .footer')));
    // Animate only the outermost match so nested items don't double-animate
    const targets = Array.from(all).filter(el => {
      for (let p = el.parentElement; p; p = p.parentElement) if (all.has(p)) return false;
      return true;
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        revealObserver.unobserve(el);
        el.classList.add('is-visible');
        // Hand transitions back to the component once the entrance is done
        const cleanup = () => {
          el.classList.remove('reveal', 'is-visible');
          el.style.removeProperty('--reveal-delay');
        };
        el.addEventListener('transitionend', function onEnd(ev) {
          if (ev.target !== el || ev.propertyName !== 'opacity') return;
          el.removeEventListener('transitionend', onEnd);
          cleanup();
        });
        setTimeout(cleanup, 2200);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // Hide targets instantly (no fade-out), then enable the entrance transition
    targets.forEach(el => {
      const siblings = Array.from(el.parentElement.children).filter(c => all.has(c));
      const index = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--reveal-delay', `${Math.min(index, 6) * 80}ms`);
      el.classList.add('reveal', 'reveal-init');
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      targets.forEach(el => el.classList.remove('reveal-init'));
      const start = () => targets.forEach(el => revealObserver.observe(el));
      if (window.ikxIntroActive) {
        document.addEventListener('ikx:intro-done', start, { once: true });
      } else {
        start();
      }
    }));
  }

  initReveal();
});
