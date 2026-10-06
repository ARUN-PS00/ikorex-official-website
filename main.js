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

  // --- 2. Interactive Material Surface Response ---
  // Pure object-level response: no mouse-following cursor spotlights.
  // Surface material contrast and edges respond when hovered via CSS transitions.

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

  // --- Dynamic Atmospheric Field ---
  // A subtle, soft, blurred environmental depth layer that provides organic atmospheric presence.
  (function addAtmosphericField() {
    if (document.querySelector('.atmospheric-field')) return;
    const field = document.createElement('div');
    field.className = 'atmospheric-field';
    field.setAttribute('aria-hidden', 'true');
    
    for (let i = 1; i <= 3; i++) {
      const layer = document.createElement('div');
      layer.className = `atmo-layer atmo-layer-${i}`;
      field.appendChild(layer);
    }

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



  // --- Visuals run only while on screen (saves battery, keeps scroll smooth) ---
  const vizEls = document.querySelectorAll('[data-viz]');
  if ('IntersectionObserver' in window) {
    const vizObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Headings animate once; looping visuals pause when off screen
        if (entry.target.classList.contains('viz')) entry.target.classList.toggle('in-view', entry.isIntersecting);
        else if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, { threshold: 0.25 });
    vizEls.forEach(el => vizObserver.observe(el));
  } else {
    vizEls.forEach(el => el.classList.add('in-view'));
  }

  // --- Hero pipeline: one invoice moves through four stages ---
  // Desktop: the hero pins and scroll position drives the stage & decode resolution; while the
  // visitor is still at the top it auto-plays. Tablets and phones auto-play
  // when visible. Reduced motion shows every stage as a static list.
  (function initPipeline() {
    const panel = document.querySelector('[data-pipeline]');
    const pin = document.querySelector('[data-hero-pin]');
    if (!panel || !pin) return;
    const inner = pin.querySelector('.hero-pin-inner');
    const steps = panel.querySelectorAll('.pipe-step');
    const stages = panel.querySelectorAll('.pipe-stage');
    const bar = panel.querySelector('.pipe-progress-bar');
    const timer = panel.querySelector('[data-pipe-timer]');
    const decodeVals = Array.from(panel.querySelectorAll('.pipe-decode-val'));
    const checkBadges = Array.from(panel.querySelectorAll('.pipe-checks b'));
    const TIMES = [0.4, 1.3, 2.4, 3.2];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1025px)');

    if (reduce.matches) {
      panel.classList.add('is-static');
      if (timer) timer.textContent = '3.2 s';
      decodeVals.forEach(el => {
        el.textContent = el.getAttribute('data-final') || el.textContent;
      });
      return;
    }

    let current = -1;
    let shownTime = 0;
    let timerFrame = null;
    function animateTimer(target) {
      cancelAnimationFrame(timerFrame);
      const from = shownTime, start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / 600);
        shownTime = from + (target - from) * (1 - Math.pow(1 - t, 3));
        if (timer) timer.textContent = `${shownTime.toFixed(1)} s`;
        if (t < 1) timerFrame = requestAnimationFrame(step);
      };
      timerFrame = requestAnimationFrame(step);
    }

    // Enterprise OCR / Document intelligence scroll-driven decode resolution
    function renderDecode(stage, progress) {
      if (decodeVals.length === 0) return;

      // Stage 0 (Capture): data is raw / unextracted
      if (stage === 0) {
        decodeVals.forEach(el => {
          const raw = el.getAttribute('data-raw') || el.getAttribute('data-final') || '';
          el.textContent = raw;
          el.style.filter = 'blur(1.2px)';
          el.style.opacity = '0.75';
          el.classList.remove('is-resolving');
        });
        checkBadges.forEach(b => {
          b.textContent = 'Evaluating...';
          b.classList.add('evaluating');
        });
        return;
      }

      // Stage 1 (Understand / AI field extraction): progressive character & field decode
      if (stage === 1) {
        const pStage2 = progress == null ? 1 : Math.min(1, Math.max(0, (progress - 0.22) / 0.25));
        
        decodeVals.forEach((el, idx) => {
          const finalStr = el.getAttribute('data-final') || el.textContent;
          const rawStr = el.getAttribute('data-raw') || finalStr;
          
          const stagger = idx * 0.08;
          const localP = Math.min(1, Math.max(0, (pStage2 - stagger) / 0.55));
          
          if (localP >= 1) {
            el.textContent = finalStr;
            el.style.filter = 'none';
            el.style.opacity = '1';
            el.classList.remove('is-resolving');
          } else if (localP <= 0) {
            el.textContent = rawStr;
            el.style.filter = 'blur(1.2px)';
            el.style.opacity = '0.75';
            el.classList.remove('is-resolving');
          } else {
            const charCount = Math.floor(localP * finalStr.length);
            const resolved = finalStr.slice(0, charCount);
            const rawPart = rawStr.slice(charCount);
            el.textContent = resolved + rawPart.slice(0, Math.max(0, finalStr.length - charCount));
            el.style.filter = `blur(${((1 - localP) * 1.2).toFixed(1)}px)`;
            el.style.opacity = (0.75 + localP * 0.25).toFixed(2);
            el.classList.add('is-resolving');
          }
        });

        checkBadges.forEach(b => {
          b.textContent = 'Evaluating...';
          b.classList.add('evaluating');
        });
        return;
      }

      // Stage 2 (Validate): fields 100% resolved, checks resolve progressively
      if (stage === 2) {
        decodeVals.forEach(el => {
          el.textContent = el.getAttribute('data-final') || el.textContent;
          el.style.filter = 'none';
          el.style.opacity = '1';
          el.classList.remove('is-resolving');
        });

        const pStage3 = progress == null ? 1 : Math.min(1, Math.max(0, (progress - 0.48) / 0.25));
        const checkThresholds = [0.15, 0.38, 0.62, 0.85];

        checkBadges.forEach((b, idx) => {
          const targetText = b.getAttribute('data-status') || b.textContent;
          const th = checkThresholds[idx] || 0.5;
          if (pStage3 >= th) {
            b.textContent = targetText;
            b.classList.remove('evaluating');
          } else {
            b.textContent = 'Evaluating...';
            b.classList.add('evaluating');
          }
        });
        return;
      }

      // Stage 3 (Post): everything is verified, posted, and complete
      if (stage === 3) {
        decodeVals.forEach(el => {
          el.textContent = el.getAttribute('data-final') || el.textContent;
          el.style.filter = 'none';
          el.style.opacity = '1';
          el.classList.remove('is-resolving');
        });
        checkBadges.forEach(b => {
          b.textContent = b.getAttribute('data-status') || b.textContent;
          b.classList.remove('evaluating');
        });
      }
    }

    function setStage(i, progress) {
      if (bar) bar.style.width = `${progress == null ? (i + 1) * 25 : Math.max(4, progress * 100)}%`;
      renderDecode(i, progress);
      if (i === current) return;
      current = i;
      steps.forEach((el, n) => {
        el.classList.toggle('is-active', n === i);
        el.classList.toggle('is-done', n < i);
      });
      stages.forEach((el, n) => {
        el.classList.toggle('is-active', n === i);
        el.classList.toggle('is-past', n < i);
      });
      animateTimer(TIMES[i]);
    }

    // Step interaction: hover, focus, and click activate stage immediately
    steps.forEach((step, index) => {
      step.setAttribute('tabindex', '0');
      step.setAttribute('role', 'button');

      const activate = () => {
        setStage(index);
        autoStage = index;
        if (autoTimer) {
          clearInterval(autoTimer);
          autoTimer = null;
          startAuto();
        }
      };

      step.addEventListener('mouseenter', activate);
      step.addEventListener('focusin', activate);
      step.addEventListener('click', activate);
      step.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });

    // Auto-play loop: state -> calm pause (4.5s) -> smooth transition -> calm pause
    let autoTimer = null;
    let autoStage = 0;
    function startAuto() {
      if (autoTimer) return;
      autoTimer = setInterval(() => {
        if (document.hidden) return;
        autoStage = (autoStage + 1) % 4;
        setStage(autoStage);
      }, 4500);
    }
    function stopAuto() {
      clearInterval(autoTimer);
      autoTimer = null;
    }

    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (!desktop.matches) visible ? startAuto() : stopAuto();
      }, { threshold: 0.2 }).observe(panel);
    }

    // Pinned scroll mode (desktop)
    let pinStart = 0, pinTravel = 1, stickyTop = 0, ticking = false;
    function measure() {
      if (!desktop.matches) {
        pin.classList.remove('is-pinned');
        pin.style.height = '';
        inner.style.top = '';
        return;
      }
      pin.classList.add('is-pinned');
      const vh = window.innerHeight;
      const innerH = inner.offsetHeight;
      stickyTop = Math.min(0, vh - innerH);
      inner.style.top = `${stickyTop}px`;
      pinTravel = Math.round(vh * 1.3);
      pin.style.height = `${innerH + pinTravel}px`;
      pinStart = pin.getBoundingClientRect().top + window.scrollY;
    }
    function onScroll() {
      if (!desktop.matches) return;
      const progress = (window.scrollY - pinStart + stickyTop) / pinTravel;
      if (progress <= 0.02) {
        startAuto();
        return;
      }
      stopAuto();
      const p = Math.min(1, Math.max(0, progress));
      autoStage = Math.min(3, Math.floor(p * 4));
      setStage(autoStage, p);
    }

    setStage(0);
    measure();
    if (desktop.matches) {
      onScroll();
      if (window.scrollY <= 2) startAuto();
    } else {
      startAuto();
    }
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { onScroll(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', () => { measure(); onScroll(); });
    window.addEventListener('load', () => { measure(); onScroll(); });
    desktop.addEventListener('change', () => {
      stopAuto();
      measure();
      if (desktop.matches) onScroll(); else startAuto();
    });
  })();

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

  // --- Hero Cursor-Responsive Diffuse Field ---
  // Soft, diffuse cursor-trailing environmental field strictly inside #hero with damped physical settling.
  const heroEl = document.getElementById('hero');
  if (heroEl && window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let heroTargetX = 0, heroTargetY = 0;
    let heroCurX = 0, heroCurY = 0;
    let heroRaf = null;
    let isInside = false;

    function renderHeroField() {
      heroCurX += (heroTargetX - heroCurX) * 0.065;
      heroCurY += (heroTargetY - heroCurY) * 0.065;

      heroEl.style.setProperty('--hero-cx', `${heroCurX.toFixed(1)}px`);
      heroEl.style.setProperty('--hero-cy', `${heroCurY.toFixed(1)}px`);

      if (isInside || Math.abs(heroTargetX - heroCurX) > 0.1 || Math.abs(heroTargetY - heroCurY) > 0.1) {
        heroRaf = requestAnimationFrame(renderHeroField);
      } else {
        heroRaf = null;
      }
    }

    heroEl.addEventListener('pointerenter', (e) => {
      const rect = heroEl.getBoundingClientRect();
      heroTargetX = heroCurX = e.clientX - rect.left;
      heroTargetY = heroCurY = e.clientY - rect.top;
      heroEl.style.setProperty('--hero-cx', `${heroCurX.toFixed(1)}px`);
      heroEl.style.setProperty('--hero-cy', `${heroCurY.toFixed(1)}px`);
      isInside = true;
      heroEl.classList.add('has-hero-pointer');
      if (!heroRaf) heroRaf = requestAnimationFrame(renderHeroField);
    }, { passive: true });

    heroEl.addEventListener('pointermove', (e) => {
      const rect = heroEl.getBoundingClientRect();
      heroTargetX = e.clientX - rect.left;
      heroTargetY = e.clientY - rect.top;
      if (!isInside) {
        isInside = true;
        heroEl.classList.add('has-hero-pointer');
      }
      if (!heroRaf) heroRaf = requestAnimationFrame(renderHeroField);
    }, { passive: true });

    heroEl.addEventListener('pointerleave', () => {
      isInside = false;
      heroEl.classList.remove('has-hero-pointer');
    });
  }

  // --- Navbar: smooth glass state response on scroll ---
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    let navTicking = false;
    let isScrolled = false;
    const updateNavbarState = () => {
      const scrolled = window.scrollY > 20;
      if (scrolled !== isScrolled) {
        isScrolled = scrolled;
        navbar.classList.toggle('is-scrolled', isScrolled);
        if (typeof syncNavIndicator === 'function') {
          requestAnimationFrame(syncNavIndicator);
        }
      }
      navTicking = false;
    };
    window.addEventListener('scroll', () => {
      if (!navTicking) {
        navTicking = true;
        requestAnimationFrame(updateNavbarState);
      }
    }, { passive: true });
    updateNavbarState();
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

  // --- Bidirectional Scroll Reveal ---
  // Elements gracefully resolve into view on entrance and naturally de-resolve when leaving,
  // working smoothly in both directions with subtle staggered composition.
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
        const el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
        } else {
          // Naturally fade and de-resolve when leaving the viewport region
          el.classList.remove('is-visible');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => {
      const siblings = Array.from(el.parentElement.children).filter(c => all.has(c));
      const index = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 70}ms`);
      el.classList.add('reveal');

      // If already in viewport on initial load, activate immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-visible');
      }
    });

    const start = () => targets.forEach(el => revealObserver.observe(el));
    if (window.ikxIntroActive) {
      document.addEventListener('ikx:intro-done', start, { once: true });
    } else {
      start();
    }
  }

  initReveal();
});
