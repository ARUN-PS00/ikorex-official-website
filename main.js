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

const initApp = () => {
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

  // --- 3. Scroll-Triggered Stat Counters ---
  const statNumbers = document.querySelectorAll('.stat-number');
  
  const countUp = (element) => {
    const targetString = element.getAttribute('data-target'); // e.g. "70" or "90"
    if (!targetString) return;
    const targetNum = parseInt(targetString, 10);
    let startNum = 0;
    
    // Lower bound start points
    const lowerBound = targetNum === 70 ? 50 : 80; 
    let currentLower = 0;
    let currentUpper = 0;
    
    const duration = 1800;
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;
    let frame = 0;
    
    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      
      // Quadratic ease out
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

  // --- Hero visual: Document-anchored 4-stage processing workflow ---
  // The central invoice file is the anchor from which each processing card
  // emerges forward into the crisp foreground, processes its stage, and smoothly
  // returns into the document before the next stage emerges.
  // --- Hero Physical 3D Digital File Stack Interaction Engine ---
  // The stack of 4 digital files physically reorders as files are activated.
  // The front file elevates, straightens, pops out its internal document sheet,
  // resolves, retracts, closes, drops backward, and moves to the rear of the stack.
  (function initHeroFileStack() {
    const container = document.getElementById('heroFileStack');
    if (!container) return;

    const files = Array.from(container.querySelectorAll('.stack-file'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let stackOrder = ['capture', 'understand', 'validate', 'post'];
    let isTransitioning = false;
    let autoTimer = null;
    let activeResolveTimer = null;
    let isVisible = true;

    function applyPositions() {
      files.forEach(file => {
        const key = file.dataset.file;
        const pos = stackOrder.indexOf(key);

        file.classList.remove('is-pos-0', 'is-pos-1', 'is-pos-2', 'is-pos-3', 'is-front');
        file.classList.add(`is-pos-${pos}`);
        if (pos === 0) {
          file.classList.add('is-front');
        }
      });
    }

    function updateAiAutomationBox(stageKey) {
      const box = document.getElementById('heroAiBox');
      if (!box) return;

      const stageItems = Array.from(box.querySelectorAll('.ai-stage-item'));
      const idxBadge = document.getElementById('aiBoxStageIndex');
      const statusBadge = document.getElementById('aiBoxStageStatus');

      const stageMap = {
        capture: { num: '01', label: 'CAPTURE', complete: false },
        understand: { num: '02', label: 'EXTRACT', complete: false },
        validate: { num: '03', label: 'VALIDATE', complete: false },
        post: { num: '04', label: 'COMPLETE \u2713', complete: true }
      };

      const info = stageMap[stageKey] || stageMap.capture;
      if (idxBadge) idxBadge.textContent = info.num;
      if (statusBadge) statusBadge.textContent = info.label;

      box.classList.toggle('is-complete', info.complete);

      stageItems.forEach(item => {
        if (item.dataset.stage === stageKey) {
          item.classList.remove('is-leaving');
          item.classList.add('is-active');
        } else if (item.classList.contains('is-active')) {
          item.classList.remove('is-active');
          item.classList.add('is-leaving');
          setTimeout(() => item.classList.remove('is-leaving'), 400);
        }
      });
    }

    function openActiveFile() {
      const frontKey = stackOrder[0];
      const frontFile = files.find(f => f.dataset.file === frontKey);
      if (!frontFile) return;

      // Synchronize the small AI automation box on the left with the active envelope stage
      updateAiAutomationBox(frontKey);

      const sheet = frontFile.querySelector('.file-emerging-sheet');

      // 1. Elevate & straighten the physical folder jacket
      frontFile.classList.add('is-open');

      // 2. Physically pop out the internal document content sheet
      if (sheet) {
        setTimeout(() => {
          sheet.classList.add('is-popped');
        }, 120);
      }

      // Stage-specific content-driven micro-animations
      clearTimeout(activeResolveTimer);
      if (frontKey === 'capture') {
        const items = frontFile.querySelectorAll('.pipeline-item');
        items.forEach((item, idx) => {
          item.classList.remove('is-captured');
          setTimeout(() => item.classList.add('is-captured'), 120 + idx * 200);
        });
      } else if (frontKey === 'understand') {
        const cells = frontFile.querySelectorAll('.field-cell');
        cells.forEach((cell, idx) => {
          cell.style.opacity = '0.25';
          cell.style.transform = 'translateY(6px)';
          setTimeout(() => {
            cell.style.opacity = '1';
            cell.style.transform = 'translateY(0)';
          }, 80 + idx * 80);
        });
      } else if (frontKey === 'validate') {
        const items = frontFile.querySelectorAll('.verify-item');
        items.forEach((item, idx) => {
          const badge = item.querySelector('.verify-badge');
          if (badge) {
            badge.style.transform = 'scale(0.85)';
            badge.style.opacity = '0.3';
            setTimeout(() => {
              badge.style.transform = 'scale(1)';
              badge.style.opacity = '1';
            }, 100 + idx * 170);
          }
        });
      } else if (frontKey === 'post') {
        const syncItems = frontFile.querySelectorAll('.sync-item');
        syncItems.forEach((item, idx) => {
          item.style.opacity = '0.3';
          setTimeout(() => {
            item.style.opacity = '1';
          }, 100 + idx * 160);
        });
        const ping = frontFile.querySelector('.notify-ping');
        if (ping) {
          setTimeout(() => {
            ping.style.animation = 'ping 1s cubic-bezier(0, 0, 0.2, 1) 2';
          }, 520);
        }
      }
    }

    function closeActiveFile(callback) {
      const frontKey = stackOrder[0];
      const frontFile = files.find(f => f.dataset.file === frontKey);
      if (!frontFile) {
        if (callback) callback();
        return;
      }

      const sheet = frontFile.querySelector('.file-emerging-sheet');
      if (sheet) {
        // Content physically retracts back into the file
        sheet.classList.remove('is-popped');
      }

      setTimeout(() => {
        // File closes
        frontFile.classList.remove('is-open');
        if (callback) callback();
      }, reduceMotion.matches ? 0 : 340);
    }

    function cycleFrontToBack(isAuto = false) {
      if (isTransitioning) return;
      isTransitioning = true;
      clearTimeout(activeResolveTimer);

      closeActiveFile(() => {
        const frontKey = stackOrder[0];
        const frontFile = files.find(f => f.dataset.file === frontKey);

        // Physically swoop backward from front toward the rear
        if (frontFile && !reduceMotion.matches) {
          frontFile.classList.add('is-cycling-out');
        }

        setTimeout(() => {
          // Reorder array: front file moves to the last position of the stack
          const out = stackOrder.shift();
          stackOrder.push(out);

          applyPositions();

          setTimeout(() => {
            if (frontFile) {
              frontFile.classList.remove('is-cycling-out');
            }
            // Elevate and open the new front file
            openActiveFile();
            isTransitioning = false;
          }, 320);
        }, reduceMotion.matches ? 0 : 220);
      });

      if (!isAuto) resetAuto();
    }

    function bringFileToFront(targetKey) {
      if (isTransitioning) return;
      if (stackOrder[0] === targetKey) {
        cycleFrontToBack();
        return;
      }

      isTransitioning = true;
      clearTimeout(activeResolveTimer);

      closeActiveFile(() => {
        const targetIdx = stackOrder.indexOf(targetKey);
        if (targetIdx > 0) {
          const shifted = stackOrder.splice(0, targetIdx);
          stackOrder = stackOrder.concat(shifted);
        }

        applyPositions();

        setTimeout(() => {
          openActiveFile();
          isTransitioning = false;
        }, 360);
      });

      resetAuto();
    }

    // Attach File Click & Keyboard Events
    files.forEach(file => {
      file.addEventListener('click', () => {
        const key = file.dataset.file;
        if (file.classList.contains('is-pos-0')) {
          cycleFrontToBack();
        } else {
          bringFileToFront(key);
        }
      });

      file.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const key = file.dataset.file;
          if (file.classList.contains('is-pos-0')) {
            cycleFrontToBack();
          } else {
            bringFileToFront(key);
          }
        }
      });
    });

    // Auto-cycle loop
    function startAuto() {
      if (autoTimer || reduceMotion.matches) return;
      autoTimer = setInterval(() => {
        if (!document.hidden && isVisible && !isTransitioning) {
          cycleFrontToBack(true);
        }
      }, 5200);
    }

    function stopAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function resetAuto() {
      stopAuto();
      startAuto();
    }

    container.addEventListener('mouseenter', stopAuto);
    container.addEventListener('mouseleave', () => {
      if (isVisible && !document.hidden) startAuto();
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible) startAuto();
        else stopAuto();
      }, { threshold: 0.15 });
      observer.observe(container);
    } else {
      startAuto();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto();
      else if (isVisible) startAuto();
    });

    // --- Vertical Scroll driving Horizontal Envelope Movement & Active Stages ---
    const heroSection = document.getElementById('hero');
    const deckElement = document.getElementById('fileStackDeck');
    let isScrollCycling = false;
    let scrollPauseTimer = null;
    let scrollRaf = null;

    function handleHeroScroll() {
      if (reduceMotion.matches || !heroSection || !deckElement) return;

      const rect = heroSection.getBoundingClientRect();
      const heroH = heroSection.offsetHeight;

      // Only active while hero is partially in view
      if (rect.bottom <= 50 || rect.top > window.innerHeight) return;

      // Vertical progress through hero: 0 to 1
      const scrollY = -rect.top;
      const maxScrollDist = Math.max(1, heroH * 0.75);
      const progress = Math.max(0, Math.min(1, scrollY / maxScrollDist));

      // Horizontal physical movement of the envelope stack
      const shiftX = (progress * -36).toFixed(1);
      deckElement.style.setProperty('--hero-scroll-shift-x', `${shiftX}px`);

      // Determine envelope stage from vertical scroll:
      // 0.00 - 0.25: capture
      // 0.25 - 0.50: understand
      // 0.50 - 0.75: validate
      // 0.75 - 1.00: post
      const stages = ['capture', 'understand', 'validate', 'post'];
      const targetIdx = Math.min(3, Math.floor(progress * 4));
      const targetStage = stages[targetIdx];

      if (targetStage !== stackOrder[0] && !isTransitioning) {
        isScrollCycling = true;
        stopAuto();
        bringFileToFront(targetStage);

        clearTimeout(scrollPauseTimer);
        scrollPauseTimer = setTimeout(() => {
          isScrollCycling = false;
          if (isVisible) startAuto();
        }, 2800);
      }
    }

    window.addEventListener('scroll', () => {
      if (!scrollRaf) {
        scrollRaf = requestAnimationFrame(() => {
          handleHeroScroll();
          scrollRaf = null;
        });
      }
    }, { passive: true });

    // Initial positioning & open first file
    applyPositions();
    setTimeout(() => {
      openActiveFile();
    }, 380);
    startAuto();
  })();

  // --- Problem Section (Diagnosis): Content-Driven Process Animation ---
  (function initProblemSection() {
    const diagSection = document.getElementById('diagnosis');
    if (!diagSection) return;

    const taskCard = diagSection.querySelector('[data-diag-card="tasks"]');
    const taskDemo = diagSection.querySelector('.proc-tasks');
    const resolvedBanner = diagSection.getElementById('taskResolvedBanner');
    const badge = diagSection.querySelector('[data-state-badge]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let isStreamlined = false;
    let autoCycleTimer = null;

    function applyTaskState(streamlined) {
      isStreamlined = streamlined;
      if (taskDemo) {
        taskDemo.classList.toggle('is-streamlined', streamlined);
        taskDemo.classList.toggle('is-congested', !streamlined);
      }
      if (resolvedBanner) {
        resolvedBanner.classList.toggle('is-active', streamlined);
      }
      if (badge) {
        badge.textContent = streamlined ? 'Automated in 0.4s \u2713' : 'Manual Bottleneck (4.8h Delay)';
        badge.style.color = streamlined ? '#10b981' : '#f59e0b';
        badge.style.background = streamlined ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)';
      }
    }

    // Looping lifecycle: Congestion Backlog -> Streamlined Transformation
    function startTaskLoop() {
      if (reduceMotion.matches || autoCycleTimer) return;
      autoCycleTimer = setInterval(() => {
        if (!document.hidden) {
          applyTaskState(!isStreamlined);
        }
      }, 5200);
    }

    function stopTaskLoop() {
      if (autoCycleTimer) {
        clearInterval(autoCycleTimer);
        autoCycleTimer = null;
      }
    }

    if (taskCard) {
      taskCard.addEventListener('mouseenter', () => {
        stopTaskLoop();
        applyTaskState(true);
      });
      taskCard.addEventListener('mouseleave', () => {
        startTaskLoop();
      });
      taskCard.addEventListener('click', () => {
        applyTaskState(!isStreamlined);
      });
    }

    // Card 2: Fragmented Sources -> Central Convergence -> Connected
    const telemetryDemo = diagSection.querySelector('.proc-telemetry');
    const telemetryBadge = diagSection.querySelector('[data-telemetry-badge]');
    const sourceRows = diagSection.querySelectorAll('#fragmentedRows .proc-row');
    let teleConnected = true;

    function cycleTelemetry() {
      if (reduceMotion.matches || document.hidden) return;
      teleConnected = !teleConnected;
      if (telemetryDemo) {
        telemetryDemo.classList.toggle('is-fragmented', !teleConnected);
        telemetryDemo.classList.toggle('is-connected', teleConnected);
      }
      if (telemetryBadge) {
        telemetryBadge.textContent = teleConnected ? 'Connected \u2713' : 'Fragmented Silos';
        telemetryBadge.style.color = teleConnected ? '#10b981' : '#f59e0b';
      }
      sourceRows.forEach((r, idx) => {
        const status = r.querySelector('.proc-row-status');
        if (status) {
          if (teleConnected) {
            status.textContent = 'Connected \u2713';
            status.className = 'proc-row-status is-connected';
          } else {
            const labels = ['Isolated', 'Siloed', 'Manual Export', 'Unlinked', 'Awaiting Sync'];
            status.textContent = labels[idx % labels.length];
            status.className = 'proc-row-status is-review';
          }
        }
      });
    }

    setInterval(cycleTelemetry, 4800);

    // Card 3: Financial Transaction Pipeline Sequence Animation
    const financeRows = document.querySelectorAll('#financialPipelineRows .proc-row');
    if (financeRows.length && !reduceMotion.matches) {
      let activeIdx = 0;
      setInterval(() => {
        if (document.hidden) return;
        financeRows.forEach((r, i) => {
          r.classList.toggle('is-active', i <= activeIdx);
        });
        activeIdx = (activeIdx + 1) % financeRows.length;
      }, 1500);
    }

    if ('IntersectionObserver' in window) {
      const diagObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startTaskLoop();
          } else {
            stopTaskLoop();
          }
        });
      }, { threshold: 0.2 });
      diagObserver.observe(diagSection);
    } else {
      startTaskLoop();
    }
  })();

  // --- Before / After Section: 4.8 Hours Manual vs 3.2 Secs Automated ---
  (function initComparisonSection() {
    const compSection = document.getElementById('comparison');
    if (!compSection) return;

    const manualRows = compSection.querySelectorAll('#manualQueueList .queue-row');
    const manualCount = compSection.getElementById('manualQueueCount');
    const manualMetric = compSection.getElementById('manualMetricVal');
    const manualOverlay = compSection.getElementById('manualMetricOverlay');

    const autoSteps = compSection.querySelectorAll('#autoPipelineNodes .pipeline-step');
    const autoOverlay = compSection.getElementById('autoMetricOverlay');
    const autoBars = compSection.querySelectorAll('#autoPerfBars span');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    let manualStep = 0;
    let autoStep = 0;

    // Manual side: Accumulating bottleneck backlog corresponding to 4.8 Hours
    function tickManualQueue() {
      if (document.hidden) return;
      manualStep = (manualStep + 1) % 4;

      if (manualStep === 0) {
        if (manualCount) manualCount.textContent = '1 pending';
        if (manualMetric) manualMetric.textContent = '1.2 Hours';
        if (manualOverlay) manualOverlay.classList.remove('is-alert');
        manualRows.forEach((r, i) => r.style.opacity = i === 0 ? '1' : '0.45');
      } else if (manualStep === 1) {
        if (manualCount) manualCount.textContent = '2 pending';
        if (manualMetric) manualMetric.textContent = '2.8 Hours';
        manualRows.forEach((r, i) => r.style.opacity = i <= 1 ? '1' : '0.45');
      } else if (manualStep === 2) {
        if (manualCount) manualCount.textContent = '3 pending';
        if (manualMetric) manualMetric.textContent = '4.8 Hours';
        if (manualOverlay) manualOverlay.classList.add('is-alert');
        manualRows.forEach(r => r.style.opacity = '1');
      }
    }

    // Automated side: Ingest -> Parse -> Verified -> 3.2s Resolve
    function tickAutoPipeline() {
      if (document.hidden) return;
      autoStep = (autoStep + 1) % 4;

      autoSteps.forEach((s, idx) => {
        s.classList.toggle('active', idx <= autoStep);
        s.classList.toggle('is-running', idx === autoStep);
      });

      if (autoBars.length) {
        autoBars.forEach((b, idx) => {
          b.classList.toggle('active', idx <= autoStep);
        });
      }

      if (autoOverlay) {
        autoOverlay.classList.toggle('is-finished', autoStep === 2 || autoStep === 3);
      }
    }

    setInterval(tickManualQueue, 2200);
    setInterval(tickAutoPipeline, 1800);
  })();

  // --- Bento Capabilities: Structural Branching & Continuous Audit Trail ---
  (function initBentoMotion() {
    const bentoSection = document.getElementById('capabilities');
    if (!bentoSection) return;

    const indPills = bentoSection.querySelectorAll('.industry-nav-pills .ind-pill');
    const branchSectors = bentoSection.querySelectorAll('.branch-sectors-grid .branch-sector');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // 1. Industry Structural Branching Selector & Dynamic Flow
    if (indPills.length && branchSectors.length) {
      let currentIndIdx = 0;

      function selectIndustry(targetSector) {
        indPills.forEach(p => p.classList.toggle('is-active', p.dataset.ind === targetSector));
        branchSectors.forEach(sec => sec.classList.toggle('is-active', sec.dataset.sector === targetSector));
      }

      indPills.forEach((pill, idx) => {
        pill.addEventListener('click', () => {
          currentIndIdx = idx;
          selectIndustry(pill.dataset.ind);
        });
      });

      if (!reduceMotion.matches) {
        setInterval(() => {
          if (document.hidden) return;
          currentIndIdx = (currentIndIdx + 1) % indPills.length;
          selectIndustry(indPills[currentIndIdx].dataset.ind);
        }, 3600);
      }
    }

    // 2. Live Continuous Audit Trail Stream (Bento Card 2)
    const auditStack = document.getElementById('liveAuditStack');
    if (auditStack && !reduceMotion.matches) {
      const sampleEvents = [
        'PO-0778 3-way match verified',
        'GST & tax split calculated',
        'Approver alert dispatched',
        'GL Account 6100-AP posted',
        'Delivery docket cryptographically sealed',
        'Supplier bank details cross-verified'
      ];
      let eventIdx = 0;

      setInterval(() => {
        if (document.hidden) return;
        const now = new Date();
        const timeStr = [now.getHours(), now.getMinutes(), now.getSeconds()]
          .map(n => String(n).padStart(2, '0')).join(':');

        const newRow = document.createElement('span');
        newRow.className = 'viz-audit-line';
        newRow.innerHTML = `<b>${timeStr}</b> ${sampleEvents[eventIdx % sampleEvents.length]} <i>&check;</i>`;
        auditStack.insertBefore(newRow, auditStack.firstChild);

        if (auditStack.children.length > 4) {
          auditStack.removeChild(auditStack.lastChild);
        }
        eventIdx++;
      }, 2900);
    }
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

  // --- Homepage Interactive Data / Star / Node Field (Canvas) ---
  // Sophisticated subtle data environment reacting to cursor with spring/damping inertia.
  // Strongest in Hero, gradually subtle down the page. No spotlights or cursor halos.
  // --- Homepage Interactive Data / Star / Node Field (Canvas) ---
  // Restrained enterprise data flow reacting to cursor with spring/damping inertia.
  (function initHeroCanvasNetwork() {
    const canvas = document.getElementById('homepageNetworkCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0, dpr = 1;
    let animFrame = null;

    let mouse = { x: -2000, y: -2000, targetX: -2000, targetY: -2000, active: false };

    const NODE_COUNT = 85;
    const CONNECT_DIST = 165;
    const MOUSE_RADIUS = 200;
    const nodes = [];

    function resize() {
      width = window.innerWidth || document.documentElement.clientWidth || 1200;
      height = window.innerHeight || document.documentElement.clientHeight || 800;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (nodes.length === 0) {
        for (let i = 0; i < NODE_COUNT; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          nodes.push({
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
            radius: 2.5 + Math.random() * 1.6,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitSpeed: 0.008 + Math.random() * 0.012,
            orbitRadius: 12 + Math.random() * 16,
            pulsePhase: Math.random() * Math.PI * 2
          });
        }
      } else {
        nodes.forEach(n => {
          n.baseX = Math.min(n.baseX, width);
          n.baseY = Math.min(n.baseY, height);
        });
      }
    }

    function updateAndDraw() {
      if (document.hidden) {
        animFrame = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const isDark = document.body.classList.contains('dark-theme');

      // Smooth mouse coordinate interpolation toward target
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.15;
        mouse.y += (mouse.targetY - mouse.y) * 0.15;
      }

      // Update & render nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Continuous micro drift
        n.orbitAngle += n.orbitSpeed;
        const driftTargetX = n.baseX + Math.cos(n.orbitAngle) * n.orbitRadius;
        const driftTargetY = n.baseY + Math.sin(n.orbitAngle) * n.orbitRadius;

        // Interactive cursor spring repulsion & damping
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (1 - dist / MOUSE_RADIUS) * 32;
            n.vx += (dx / dist) * force * 0.16;
            n.vy += (dy / dist) * force * 0.16;
          }
        }

        // Spring force back to equilibrium
        const springX = (driftTargetX - n.x) * 0.045;
        const springY = (driftTargetY - n.y) * 0.045;
        n.vx = (n.vx + springX) * 0.82;
        n.vy = (n.vy + springY) * 0.82;

        n.x += n.vx;
        n.y += n.vy;

        // Draw connections between nearby nodes (deforms smoothly with node movement)
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);

          if (dist < CONNECT_DIST) {
            const proximity = 1 - dist / CONNECT_DIST;
            const lineAlpha = isDark ? (proximity * 0.45) : (proximity * 0.35);
            ctx.strokeStyle = isDark
              ? `rgba(150, 165, 180, ${lineAlpha.toFixed(3)})`
              : `rgba(90, 105, 125, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }

        // Draw node point (clearly visible restrained data node)
        n.pulsePhase += 0.03;
        const pulse = 1 + Math.sin(n.pulsePhase) * 0.12;
        const nodeAlpha = isDark ? 0.90 : 0.80;
        ctx.fillStyle = isDark
          ? `rgba(200, 210, 220, ${nodeAlpha})`
          : `rgba(71, 85, 105, ${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrame = requestAnimationFrame(updateAndDraw);
    }

    function startLoop() {
      if (!animFrame && !document.hidden) {
        animFrame = requestAnimationFrame(updateAndDraw);
      }
    }

    function stopLoop() {
      if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
      }
    }

    const onPointerMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      if (!mouse.active) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
      }
      startLoop();
    };

    window.addEventListener('pointerenter', onPointerMove, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', () => { mouse.active = false; });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        startLoop();
      }, 80);
    }, { passive: true });

    window.addEventListener('scroll', () => {
      startLoop();
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else startLoop();
    });

    resize();
    startLoop();
  })();

  // ==========================================================================
  // CAPABILITIES SECTION: "ENTERPRISE AUTOMATION BUILT FOR REAL OPERATIONS"
  // 1. DYNAMIC INTERACTIVE AUTOMATION NETWORK BACKGROUND (CANVAS)
  // 2. CONTINUOUS BIDIRECTIONAL SCROLL-DRIVEN SECTION CHOREOGRAPHY
  // ==========================================================================

  // --- 1. Dynamic Interactive Automation Network Canvas ---
  (function initCapabilitiesAutomationNetwork() {
    const section = document.getElementById('capabilities');
    const canvas = document.getElementById('capabilitiesNetworkCanvas');
    if (!section || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = null;
    let isVisible = false;

    // Mouse tracking for damped interactive deflection
    let mouse = { x: -9999, y: -9999, active: false };

    // Section dimensions resize
    function resize() {
      const rect = section.getBoundingClientRect();
      width = Math.max(300, rect.width);
      height = Math.max(300, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    // Node network generation
    const NODE_COUNT = 46;
    const MAX_DIST = 140;
    const nodes = [];

    function initNodes() {
      nodes.length = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        // Distribute nicely with subtle margin
        const x = Math.random() * (width || 1200);
        const y = Math.random() * (height || 800);
        const depth = Math.random() < 0.35 ? 0.45 : (0.75 + Math.random() * 0.25); // 2 depth tiers

        nodes.push({
          x,
          y,
          homeX: x,
          homeY: y,
          vx: (Math.random() - 0.5) * 0.32 * depth,
          vy: (Math.random() - 0.5) * 0.28 * depth,
          radius: depth < 0.6 ? 1.5 : (2.0 + Math.random() * 0.8),
          depth,
          phase: Math.random() * Math.PI * 2,
          // Spring-damper displacement from mouse
          dx: 0,
          dy: 0,
          dvx: 0,
          dvy: 0
        });
      }
    }

    // Dynamic Data Packets (Micro pulses traveling along connecting traces)
    const PACKET_COUNT = 10;
    const packets = [];

    function initPackets() {
      packets.length = 0;
      for (let i = 0; i < PACKET_COUNT; i++) {
        packets.push({
          fromIdx: Math.floor(Math.random() * NODE_COUNT),
          toIdx: -1,
          progress: Math.random(),
          speed: 0.008 + Math.random() * 0.012,
          trail: []
        });
      }
    }

    function pickTargetNode(fromIdx) {
      const from = nodes[fromIdx];
      if (!from) return -1;
      const candidates = [];
      for (let j = 0; j < nodes.length; j++) {
        if (j === fromIdx) continue;
        const dx = (nodes[j].x + nodes[j].dx) - (from.x + from.dx);
        const dy = (nodes[j].y + nodes[j].dy) - (from.y + from.dy);
        const dist = Math.hypot(dx, dy);
        if (dist < MAX_DIST) candidates.push(j);
      }
      if (candidates.length === 0) {
        return Math.floor(Math.random() * nodes.length);
      }
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Pointer events on section for subtle damped deflection
    function onPointerMove(e) {
      const rect = section.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }

    function onPointerLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    section.addEventListener('pointermove', onPointerMove, { passive: true });
    section.addEventListener('pointerleave', onPointerLeave, { passive: true });

    // Render loop
    function render(time) {
      if (!isVisible) return;

      const isDark = document.body.classList.contains('dark-theme');
      ctx.clearRect(0, 0, width, height);

      const MOUSE_RADIUS = 180;
      const SPRING_K = 0.065;
      const DAMPING = 0.84;

      // 1. Update and draw nodes with damped cursor influence & ambient drift
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Ambient organic drift
        n.x += n.vx;
        n.y += n.vy;

        // Soft bounce within boundaries
        if (n.x < 10) { n.x = 10; n.vx *= -1; }
        else if (n.x > width - 10) { n.x = width - 10; n.vx *= -1; }
        if (n.y < 10) { n.y = 10; n.vy *= -1; }
        else if (n.y > height - 10) { n.y = height - 10; n.vy *= -1; }

        // Cursor deflection physics
        let targetDx = 0;
        let targetDy = 0;

        if (mouse.active) {
          const mdx = (n.x + n.dx) - mouse.x;
          const mdy = (n.y + n.dy) - mouse.y;
          const mDist = Math.hypot(mdx, mdy);
          if (mDist < MOUSE_RADIUS && mDist > 0) {
            const force = (1 - mDist / MOUSE_RADIUS) * 26 * n.depth;
            targetDx = (mdx / mDist) * force;
            targetDy = (mdy / mDist) * force;
          }
        }

        // Spring settling
        n.dvx += (targetDx - n.dx) * SPRING_K;
        n.dvy += (targetDy - n.dy) * SPRING_K;
        n.dvx *= DAMPING;
        n.dvy *= DAMPING;
        n.dx += n.dvx;
        n.dy += n.dvy;

        // Render node point
        const posX = n.x + n.dx;
        const posY = n.y + n.dy;
        const pulse = 0.85 + Math.sin(time * 0.002 + n.phase) * 0.15;
        const alpha = n.depth < 0.6
          ? (isDark ? 0.32 : 0.22) * pulse
          : (isDark ? 0.65 : 0.50) * pulse;

        ctx.beginPath();
        ctx.arc(posX, posY, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? (n.depth > 0.6 ? `rgba(56, 189, 248, ${alpha})` : `rgba(148, 163, 184, ${alpha})`)
          : (n.depth > 0.6 ? `rgba(0, 102, 204, ${alpha})` : `rgba(100, 116, 139, ${alpha})`);
        ctx.fill();
      }

      // 2. Render connecting traces
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const ax = a.x + a.dx;
        const ay = a.y + a.dy;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const bx = b.x + b.dx;
          const by = b.y + b.dy;
          const d = Math.hypot(bx - ax, by - ay);

          if (d < MAX_DIST) {
            const strength = (1 - d / MAX_DIST) * (a.depth * b.depth);
            const lineAlpha = isDark ? strength * 0.22 : strength * 0.16;

            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${lineAlpha})`
              : `rgba(0, 102, 204, ${lineAlpha})`;
            ctx.lineWidth = a.depth > 0.6 && b.depth > 0.6 ? 1.0 : 0.7;
            ctx.stroke();
          }
        }
      }

      // 3. Render dynamic traveling data packets
      for (let p = 0; p < packets.length; p++) {
        const pkt = packets[p];
        if (pkt.toIdx === -1 || pkt.toIdx >= nodes.length) {
          pkt.toIdx = pickTargetNode(pkt.fromIdx);
        }

        const from = nodes[pkt.fromIdx];
        const to = nodes[pkt.toIdx];

        if (!from || !to) {
          pkt.fromIdx = Math.floor(Math.random() * nodes.length);
          pkt.toIdx = -1;
          continue;
        }

        const fx = from.x + from.dx;
        const fy = from.y + from.dy;
        const tx = to.x + to.dx;
        const ty = to.y + to.dy;

        // Current packet position
        const px = fx + (tx - fx) * pkt.progress;
        const py = fy + (ty - fy) * pkt.progress;

        // Draw bead
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#38bdf8' : '#0066cc';
        ctx.shadowColor = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(0, 102, 204, 0.5)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Advance packet
        pkt.progress += pkt.speed;
        if (pkt.progress >= 1) {
          pkt.fromIdx = pkt.toIdx;
          pkt.toIdx = pickTargetNode(pkt.fromIdx);
          pkt.progress = 0;
        }
      }

      if (!reduceMotion) {
        rafId = requestAnimationFrame(render);
      }
    }

    function startLoop() {
      if (!rafId && isVisible) {
        rafId = requestAnimationFrame(render);
      }
    }

    function stopLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    // Viewport intersection observer to avoid running off-screen
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      }, { rootMargin: '120px 0px 120px 0px' });
      observer.observe(section);
    } else {
      isVisible = true;
      startLoop();
    }

    window.addEventListener('resize', () => {
      resize();
      initNodes();
      initPackets();
      if (reduceMotion) render(0);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else if (isVisible) startLoop();
    });

    resize();
    initNodes();
    initPackets();
    render(0);
  })();

  // --- 2. Continuous Scroll-Driven Section Choreography ---
  (function initCapabilitiesScrollChoreography() {
    const section = document.getElementById('capabilities');
    if (!section) return;

    const titleLines = Array.from(section.querySelectorAll('.cap-title-inner'));
    const badge = section.querySelector('.custom-badge');
    const subtitle = section.querySelector('.section-subtitle');
    const cards = Array.from(section.querySelectorAll('.bento-card'));
    const wasteStages = document.getElementById('wasteFlowStages');
    const velocityPath = document.getElementById('bentoVelocityPath');
    const velocityChip = section.querySelector('.viz-results-chip');
    const insightBarNew = section.querySelector('.insight-card .bar-new');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Precalculate velocity SVG path total length
    let pathLength = 260;
    if (velocityPath && velocityPath.getTotalLength) {
      try {
        pathLength = velocityPath.getTotalLength();
        velocityPath.style.strokeDasharray = `${pathLength}`;
        velocityPath.style.strokeDashoffset = `${pathLength}`;
      } catch (e) { }
    }

    // Asymmetric starting spatial roles for the 5 cards:
    // [shiftX, shiftY, startScale, startOpacity, startBlur]
    // Card 1: Multi-Sector (Top-Left, Span 7)
    // Card 2: CA Governance (Top-Right, Span 5)
    // Card 3: Friction (Bottom-Left, Span 4)
    // Card 4: Velocity Curve (Bottom-Center, Span 4)
    // Card 5: Economic Benchmarks (Bottom-Right, Span 4)
    // Stable entrance progression: cards remain firmly locked in their CSS grid columns
    const CARD_OFFSETS = [
      { scale: 0.98, opacity: 0.40 }, // Card 1: Multi-Sector
      { scale: 0.98, opacity: 0.40 }, // Card 2: CA Governance
      { scale: 0.98, opacity: 0.40 }, // Card 3: Friction
      { scale: 0.98, opacity: 0.40 }, // Card 4: Velocity Curve
      { scale: 0.98, opacity: 0.40 }  // Card 5: Economic Benchmarks
    ];

    let ticking = false;

    function updateChoreography() {
      if (reduceMotion) {
        // Reduced motion: immediate final pristine resolution
        cards.forEach(card => {
          card.style.transform = '';
          card.style.opacity = '1';
          card.style.filter = '';
        });
        if (titleLines.length) {
          titleLines.forEach(l => {
            l.style.transform = '';
            l.style.opacity = '1';
            l.style.filter = '';
          });
        }
        if (velocityPath) velocityPath.style.strokeDashoffset = '0';
        if (insightBarNew) insightBarNew.style.width = '30%';
        ticking = false;
        return;
      }

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      const enterY = vh * 0.92;
      const resolveY = vh * 0.12;
      const rawProgress = (enterY - rect.top) / (enterY - resolveY);
      const progress = Math.max(0, Math.min(1, rawProgress));

      // CSS Custom property exposed for coordinate styling
      section.style.setProperty('--cap-scroll-progress', progress.toFixed(4));

      // A. Composed Typography Mask Reveal
      if (badge) {
        const pBadge = Math.min(1, Math.max(0, progress * 3.0));
        badge.style.opacity = pBadge.toFixed(3);
        badge.style.transform = `translate3d(0, ${((1 - pBadge) * 14).toFixed(1)}px, 0)`;
      }

      if (titleLines.length) {
        titleLines.forEach((line, idx) => {
          const start = idx === 0 ? 0.04 : 0.14;
          const end = idx === 0 ? 0.48 : 0.60;
          const pLine = Math.min(1, Math.max(0, (progress - start) / (end - start)));
          const shiftY = (1 - pLine) * 36;
          const blur = (1 - pLine) * 6;
          line.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0)`;
          line.style.filter = `blur(${blur.toFixed(1)}px)`;
          line.style.opacity = pLine.toFixed(3);
        });
      }

      if (subtitle) {
        const pSub = Math.min(1, Math.max(0, (progress - 0.20) / 0.46));
        const shiftY = (1 - pSub) * 18;
        const blur = (1 - pSub) * 4;
        subtitle.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0)`;
        subtitle.style.filter = `blur(${blur.toFixed(1)}px)`;
        subtitle.style.opacity = pSub.toFixed(3);
      }

      // B. Cards Smooth Reveal (Zero spatial displacement to prevent overlap)
      cards.forEach((card, idx) => {
        const cfg = CARD_OFFSETS[idx] || CARD_OFFSETS[0];
        const curScale = cfg.scale + (1 - cfg.scale) * progress;
        const curOpacity = cfg.opacity + (1 - cfg.opacity) * progress;

        card.style.transform = `scale(${curScale.toFixed(4)})`;
        card.style.opacity = curOpacity.toFixed(3);
        card.style.filter = '';
      });

      // C. Internal Product Dynamics:
      // 1. Friction elimination collapse (Card 3)
      if (wasteStages) {
        if (progress >= 0.50) {
          wasteStages.classList.add('is-collapsed');
        } else {
          wasteStages.classList.remove('is-collapsed');
        }
      }

      // 2. Velocity ROI Curve SVG Draw (Card 4)
      if (velocityPath) {
        const pCurve = Math.min(1, Math.max(0, (progress - 0.32) / 0.58));
        const offset = (1 - pCurve) * pathLength;
        velocityPath.style.strokeDashoffset = `${offset.toFixed(1)}`;
        if (velocityChip) {
          velocityChip.style.opacity = pCurve > 0.85 ? '1' : '0.55';
          velocityChip.style.borderColor = pCurve > 0.85 ? 'rgba(0, 136, 255, 0.45)' : '';
        }
      }

      // 3. Economic benchmark savings compression (Card 5)
      if (insightBarNew) {
        const pBench = Math.min(1, Math.max(0, (progress - 0.38) / 0.52));
        const barWidth = 100 - (pBench * 70); // 100% down to 30% width
        insightBarNew.style.width = `${barWidth.toFixed(1)}%`;
      }

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateChoreography);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial frame pass
    updateChoreography();
  })();

  // ============================================================
  // PART 4: SERVICES CONTAINED 3-SLIDE CAROUSEL
  // ============================================================
  (function initServicesCarousel() {
    const servicesSection = document.getElementById('services');
    const trackShell = document.getElementById('servicesTrackShell');
    const track = document.getElementById('servicesJourneyTrack');
    const progressBar = document.getElementById('servicesProgressBar');
    const prevBtn = document.getElementById('servicesCarouselPrev');
    const nextBtn = document.getElementById('servicesCarouselNext');
    if (!servicesSection || !trackShell || !track) return;

    // Clean up any stray clones if present from previous builds
    track.querySelectorAll('.is-clone').forEach(el => el.remove());

    const cards = Array.from(track.querySelectorAll('.service-journey-card'));
    const tabs = Array.from(servicesSection.querySelectorAll('.track-tab'));
    if (!cards.length) return;

    let currentIndex = 0;
    let autoTimer = null;
    let isPaused = false;
    let resumeTimeout = null;

    function goToCard(idx) {
      currentIndex = ((idx % cards.length) + cards.length) % cards.length;

      // Physically translate the track (0%, -100%, -200%)
      track.style.transition = 'transform 550ms cubic-bezier(0.22, 1, 0.36, 1)';
      track.style.setProperty('transform', `translate3d(-${currentIndex * 100}%, 0, 0)`, 'important');

      // Active card indication
      cards.forEach((card, i) => {
        card.classList.toggle('is-active', i === currentIndex);
      });

      // 01 / 02 / 03 navigation controls active state
      tabs.forEach((tab, i) => {
        tab.classList.toggle('is-active', i === currentIndex);
      });

      // Progress rail sync
      if (progressBar) {
        const pct = ((currentIndex + 1) / cards.length) * 100;
        progressBar.style.width = `${pct}%`;
      }
    }

    function scheduleResume() {
      clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        isPaused = false;
      }, 5000);
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoTimer = setInterval(() => {
        if (!isPaused && document.visibilityState === 'visible') {
          goToCard(currentIndex + 1);
        }
      }, 5000);
    }

    function stopAutoPlay() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    // Global navigation API for buttons and inline onclick fail-safes
    window.ikxServicesMove = function(direction) {
      isPaused = true;
      goToCard(currentIndex + direction);
      scheduleResume();
    };

    window.ikxServicesGoTo = function(targetIdx) {
      isPaused = true;
      goToCard(targetIdx);
      scheduleResume();
    };

    // Global Capture-Phase Click Interceptor to guarantee left/right buttons always fire
    document.addEventListener('click', (e) => {
      const prev = e.target.closest('#servicesCarouselPrev, .services-carousel-prev');
      if (prev) {
        e.preventDefault();
        e.stopPropagation();
        window.ikxServicesMove(-1);
        return;
      }
      const next = e.target.closest('#servicesCarouselNext, .services-carousel-next');
      if (next) {
        e.preventDefault();
        e.stopPropagation();
        window.ikxServicesMove(1);
        return;
      }
    }, true);

    // Direct event listener on LEFT arrow button
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.ikxServicesMove(-1);
      });
      prevBtn.addEventListener('focus', () => { isPaused = true; });
      prevBtn.addEventListener('blur', () => { scheduleResume(); });
    }

    // Direct event listener on RIGHT arrow button
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.ikxServicesMove(1);
      });
      nextBtn.addEventListener('focus', () => { isPaused = true; });
      nextBtn.addEventListener('blur', () => { scheduleResume(); });
    }

    // Connect 01 / 02 / 03 numbered navigation controls
    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        window.ikxServicesGoTo(idx);
      });
      tab.addEventListener('focus', () => { isPaused = true; });
      tab.addEventListener('blur', () => { scheduleResume(); });
    });

    // Keyboard support: ArrowLeft / ArrowRight
    window.addEventListener('keydown', (e) => {
      const rect = servicesSection.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowLeft') {
        window.ikxServicesMove(-1);
      } else if (e.key === 'ArrowRight') {
        window.ikxServicesMove(1);
      }
    });

    // Card click selection
    cards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        window.ikxServicesGoTo(idx);
      });
    });

    // Pause autoplay on hover/interaction
    const carouselWrapper = servicesSection.querySelector('.services-carousel-wrapper') || trackShell;
    carouselWrapper.addEventListener('mouseenter', () => { isPaused = true; });
    carouselWrapper.addEventListener('mouseleave', () => { scheduleResume(); });
    carouselWrapper.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
    carouselWrapper.addEventListener('touchend', () => { scheduleResume(); }, { passive: true });

    // Initial activation: Slide 01
    goToCard(0);
    startAutoPlay();
  })();

  // ============================================================
  // PART 3: PREMIUM SCROLL-LINKED PARALLAX SYSTEM
  // Reversible subtle parallax without grid layout collision
  // ============================================================
  (function initCoordinatedParallax() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    const parallaxItems = [
      { selector: '.comparison-section .section-title, .risk-section .section-title', rate: 0.03 },
      { selector: '.comparison-card.manual-card', rate: -0.02 },
      { selector: '.comparison-card.automated-card', rate: 0.02 },
      { selector: '.risk-card', rate: 0.015 },
      { selector: '.metric-overlay', rate: -0.02 },
      { selector: '.blog-card.is-featured', rate: 0.02 }
    ];

    const elements = [];
    parallaxItems.forEach(item => {
      document.querySelectorAll(item.selector).forEach(el => {
        elements.push({ el, rate: item.rate });
      });
    });

    if (!elements.length) return;

    let ticking = false;

    function applyParallax() {
      const windowHeight = window.innerHeight;

      elements.forEach(item => {
        const rect = item.el.getBoundingClientRect();
        if (rect.bottom >= -100 && rect.top <= windowHeight + 100) {
          const centerDelta = (rect.top + rect.height / 2) - (windowHeight / 2);
          const yOffset = (centerDelta * item.rate).toFixed(1);
          item.el.style.transform = `translate3d(0, ${yOffset}px, 0)`;
        }
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyParallax);
      }
    }, { passive: true });

    applyParallax();
  })();

  // --- Bidirectional Scroll Reveal ---
  // Elements gracefully resolve into view on entrance and naturally de-resolve when leaving,
  // working smoothly in both directions with subtle staggered composition.
  const REVEAL_SELECTOR = [
    '.hero-visual', '.trust-bar',
    '.section-head > *', '.section-title', '.section-subtitle', '.custom-badge',
    '.page-title', '.page-lead', '.eyebrow', '.trust-stat', '.about-hero-copy .hero-actions', '.founders-panel',
    '.diagnosis-card', '.comparison-card', '.comparison-cta', '.risk-card', '.bento-card', '.capability-card', '.stats-bento-card',
    '.blog-card', '.cta-card', '.engine-card', '.solution-horizontal-card', '.segmented-nav',
    '.value-row', '.team-card', '.process-step', '.about-story-copy > p',
    '.contact-info-card', '.contact-form-card', '.map-container', '.footnote'
  ].join(', ');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    // Exclude #capabilities and #servicesTrackShell so dedicated scroll-progress engines operate cleanly
    const all = new Set(Array.from(document.querySelectorAll(REVEAL_SELECTOR))
      .filter(el => !el.closest('#preloader, .navbar, .footer, #capabilities, #servicesTrackShell')));
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
      // Assign typographic levels for structured motion hierarchy
      if (el.matches('.custom-badge, .card-pretitle, .bento-badge, .eyebrow')) {
        el.classList.add('typo-level-1');
      } else if (el.matches('.section-title, .hero-title, .capability-title, .risk-card-title, .card-title, .page-title')) {
        el.classList.add('typo-level-2');
      } else if (el.matches('.section-subtitle, .hero-description, .hero-rotator, .page-lead, .card-body, .capability-body, .risk-card-body, .hero-checklist')) {
        el.classList.add('typo-level-3');
      } else if (el.matches('.perf-val, .metric-val, .stat-num, .tab-index-badge')) {
        el.classList.add('typo-level-4');
      } else if (el.matches('.hero-actions, .comparison-cta, .card-link, .btn')) {
        el.classList.add('typo-level-5');
      }

      const siblings = Array.from(el.parentElement.children).filter(c => all.has(c));
      const index = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--reveal-delay', `${Math.min(index, 6) * 75}ms`);
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

  // ============================================================
  // FAST LIGHTWEIGHT "CONTINUITY" PAGE TRANSITION SYSTEM
  // ============================================================
  (function initPageContinuity() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check for incoming continuity state from same-origin navigation
    if (!reduceMotion) {
      try {
        if (sessionStorage.getItem('ikx-continuity-nav') === '1') {
          sessionStorage.removeItem('ikx-continuity-nav');
          document.body.classList.add('is-page-entering');
          setTimeout(() => {
            document.body.classList.remove('is-page-entering');
          }, 320);
        }
      } catch (_) {}
    }

    // BFCache and back/forward restore cleanup
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('is-page-exiting');
      document.body.classList.remove('is-page-entering');
    });

    // Intercept internal same-origin link clicks for fast 190ms exit hand-off
    document.addEventListener('click', (e) => {
      // Ignore modified or non-primary clicks
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const link = e.target.closest('a');
      if (!link) return;

      // Ignore downloads, target blank, protocols
      if (link.hasAttribute('download')) return;
      if (link.target && link.target !== '_self') return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }

      let targetUrl;
      try {
        targetUrl = new URL(link.href, window.location.href);
      } catch (_) {
        return;
      }

      // Internal same-origin only
      if (targetUrl.origin !== window.location.origin) return;

      // In-page anchor link (e.g. index.html#hero on home page) -> allow smooth anchor jump
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
        return;
      }

      if (reduceMotion) {
        return;
      }

      e.preventDefault();

      // Fast, lightweight 190ms exit hand-off
      document.body.classList.add('is-page-exiting');
      try {
        sessionStorage.setItem('ikx-continuity-nav', '1');
      } catch (_) {}

      setTimeout(() => {
        window.location.href = targetUrl.href;
      }, 190);
    });
  })();

  initReveal();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
