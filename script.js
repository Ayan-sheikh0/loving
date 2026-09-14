(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       DOM ELEMENTS & STATE
       ===================================================== */
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pages = Array.from(document.querySelectorAll('.page'));
    const totalPages = pages.length;

    const progressLabel = document.getElementById('progress-label');
    const progressDots = Array.from(document.querySelectorAll('.progress-dots .dot'));
    const backBtn = document.getElementById('back-btn');
    const replayBtn = document.getElementById('replay-btn');

    let currentPage = 1;
    let isTransitioning = false;
    let storyHistory = [1];

    function getPage(num) {
      return pages.find(p => Number(p.dataset.page) === num);
    }

    /* =====================================================
       NAVIGATION CONTROLS
       ===================================================== */
    function updateProgress(num) {
      if (progressLabel) {
        progressLabel.textContent = `${num} / ${totalPages}`;
      }
      if (progressDots) {
        progressDots.forEach((dot, idx) => {
          if (idx + 1 === num) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }
      if (backBtn) {
        if (num === 1) {
          backBtn.hidden = true;
        } else {
          backBtn.hidden = false;
        }
      }
    }

    function goTo(targetPage, { isBack = false } = {}) {
      if (
        targetPage < 1 ||
        targetPage > totalPages ||
        targetPage === currentPage ||
        isTransitioning
      ) {
        return;
      }

      const fromEl = getPage(currentPage);
      const toEl = getPage(targetPage);
      if (!fromEl || !toEl) return;

      isTransitioning = true;

      // History update
      if (isBack) {
        if (storyHistory.length > 1) {
          storyHistory.pop();
        }
      } else {
        storyHistory.push(targetPage);
      }

      const direction = isBack ? 'prev' : 'next';

      // Transition animations
      if (!reduceMotion) {
        fromEl.classList.remove('active', 'entering-next', 'leaving-next', 'entering-prev', 'leaving-prev');
        toEl.classList.remove('active', 'entering-next', 'leaving-next', 'entering-prev', 'leaving-prev');

        fromEl.classList.add(direction === 'next' ? 'leaving-next' : 'leaving-prev');
        toEl.classList.add('active', direction === 'next' ? 'entering-next' : 'entering-prev');
      } else {
        fromEl.classList.remove('active');
        toEl.classList.add('active');
      }

      currentPage = targetPage;
      updateProgress(currentPage);

      setTimeout(() => {
        fromEl.classList.remove('active', 'leaving-next', 'leaving-prev');
        toEl.classList.remove('entering-next', 'entering-prev');
        isTransitioning = false;
        toEl.scrollTop = 0;
        window.scrollTo(0, 0);
      }, reduceMotion ? 50 : 480);
    }

    // Attach Next Buttons
    document.querySelectorAll('[data-next]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const parentPage = btn.closest('.page');
        if (!parentPage) return;
        const pNum = Number(parentPage.dataset.page);
        if (pNum && pNum < totalPages) {
          goTo(pNum + 1);
        }
      });
    });

    // Attach Back Button
    if (backBtn) {
      backBtn.addEventListener('click', e => {
        e.preventDefault();
        if (storyHistory.length > 1) {
          const prev = storyHistory[storyHistory.length - 2];
          goTo(prev, { isBack: true });
        } else if (currentPage > 1) {
          goTo(currentPage - 1, { isBack: true });
        }
      });
    }

    // Progress Dots Click to navigate
    progressDots.forEach((dot, idx) => {
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', () => {
        const target = idx + 1;
        if (target !== currentPage) {
          goTo(target, { isBack: target < currentPage });
        }
      });
    });

    // Mobile Touch Swipe Gesture Support
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', e => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    document.addEventListener('touchend', e => {
      if (e.changedTouches && e.changedTouches.length === 1) {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleSwipeGesture();
      }
    }, { passive: true });

    function handleSwipeGesture() {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const minSwipeDistance = 55;

      // Ensure horizontal swipe is dominant over vertical scrolling
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > minSwipeDistance) {
        // If letter overlay or photo lightbox is open, don't swipe page
        if (letterOverlay && letterOverlay.style.display !== 'none') {
          return;
        }
        if (galleryLightbox && galleryLightbox.style.display !== 'none') {
          return;
        }

        if (deltaX < 0) {
          // Swipe Left -> Next Page
          if (currentPage < totalPages) {
            goTo(currentPage + 1);
          }
        } else {
          // Swipe Right -> Previous Page
          if (currentPage > 1) {
            goTo(currentPage - 1, { isBack: true });
          }
        }
      }
    }

    /* =====================================================
       PAGE 3 — TRAIT CARDS TOGGLE
       ===================================================== */
    const traitCards = document.querySelectorAll('.trait-card');
    traitCards.forEach(card => {
      card.addEventListener('click', () => {
        const isExpanded = card.classList.toggle('is-expanded');
        card.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      });
    });

    /* =====================================================
       PAGE 4 — HEART ENVELOPE & REAL HANDWRITTEN LETTER
       ===================================================== */
    const heartEnvelope = document.getElementById('heart-envelope');
    const openLetterBtn = document.getElementById('open-letter-btn');
    const letterOverlay = document.getElementById('letter-overlay');
    const letterBackdrop = document.getElementById('letter-backdrop');
    const closeLetterBtn = document.getElementById('close-letter');
    const closeLetterTop = document.getElementById('close-letter-top');

    function spawnHeartBurst(x, y) {
      if (reduceMotion) return;
      for (let i = 0; i < 14; i++) {
        const heart = document.createElement('span');
        heart.textContent = Math.random() < 0.6 ? '❤' : '✨';
        heart.style.position = 'fixed';
        heart.style.left = `${x}px`;
        heart.style.top = `${y}px`;
        heart.style.fontSize = `${14 + Math.random() * 18}px`;
        heart.style.color = Math.random() < 0.5 ? '#ff5b8c' : '#ff85a7';
        heart.style.pointerEvents = 'none';
        heart.style.zIndex = '120';
        heart.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        document.body.appendChild(heart);

        const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
        const dist = 50 + Math.random() * 90;
        const destX = x + Math.cos(angle) * dist;
        const destY = y + Math.sin(angle) * dist - 30;

        requestAnimationFrame(() => {
          heart.style.transform = `translate(${destX - x}px, ${destY - y}px) scale(${0.8 + Math.random() * 0.5})`;
          heart.style.opacity = '0';
        });

        setTimeout(() => {
          if (heart.parentNode) heart.remove();
        }, 850);
      }
    }

    function openLoveLetter(e) {
      if (heartEnvelope) {
        heartEnvelope.classList.add('is-open');
        heartEnvelope.setAttribute('aria-expanded', 'true');
      }

      if (e) {
        const rect = heartEnvelope ? heartEnvelope.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
        const clickX = e.clientX || (rect.left + rect.width / 2);
        const clickY = e.clientY || (rect.top + rect.height / 2);
        spawnHeartBurst(clickX, clickY);
      }

      setTimeout(() => {
        if (letterOverlay) {
          letterOverlay.style.display = 'flex';
        }
      }, 350);
    }

    function closeLoveLetter() {
      if (letterOverlay) {
        letterOverlay.style.display = 'none';
      }
    }

    if (heartEnvelope) {
      heartEnvelope.addEventListener('click', openLoveLetter);
    }

    if (openLetterBtn) {
      openLetterBtn.addEventListener('click', openLoveLetter);
    }

    if (closeLetterBtn) {
      closeLetterBtn.addEventListener('click', closeLoveLetter);
    }

    if (closeLetterTop) {
      closeLetterTop.addEventListener('click', closeLoveLetter);
    }

    if (letterBackdrop) {
      letterBackdrop.addEventListener('click', closeLoveLetter);
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && letterOverlay && letterOverlay.style.display !== 'none') {
        closeLoveLetter();
      }
    });

    /* =====================================================
       PAGE 7 — THE QUESTION (PLAYFUL NO BUTTON DODGE & YES)
       ===================================================== */
    const questionCard = document.getElementById('question-card');
    const questionButtons = document.getElementById('question-buttons');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const noDodgeMsg = document.getElementById('no-dodge-msg');
    const yesResult = document.getElementById('yes-result');

    const playfulQuotes = [
      "Arre socho to sahi! 🙈",
      "No ka option hi nahi hai! 😉",
      "Shreya please! Sirf YES chalega ❤️",
      "Pakka? Ek baar aur socho! ✨",
      "Dil se poocho, YES hi aayega! 🥰",
      "Main nahi maanunga jab tak YES na kaho! 💖"
    ];
    let quoteIndex = 0;

    function dodgeNoButton() {
      if (!noBtn) return;
      noBtn.classList.add('is-dodging');

      const btnRect = noBtn.getBoundingClientRect();
      const padding = 20;
      const topOffset = 80; // keep below header

      const maxX = window.innerWidth - btnRect.width - padding;
      const maxY = window.innerHeight - btnRect.height - padding;

      const randomX = Math.max(padding, Math.floor(Math.random() * maxX));
      const randomY = Math.max(topOffset, Math.floor(Math.random() * maxY));

      noBtn.style.left = `${randomX}px`;
      noBtn.style.top = `${randomY}px`;

      if (noDodgeMsg) {
        noDodgeMsg.textContent = playfulQuotes[quoteIndex % playfulQuotes.length];
        quoteIndex++;
      }

      if ('vibrate' in navigator) {
        try { navigator.vibrate(35); } catch (_) {}
      }
    }

    if (noBtn) {
      noBtn.addEventListener('mouseenter', dodgeNoButton);
      noBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        dodgeNoButton();
      }, { passive: false });
      noBtn.addEventListener('click', e => {
        e.preventDefault();
        dodgeNoButton();
      });
    }

    if (yesBtn) {
      yesBtn.addEventListener('click', e => {
        e.preventDefault();
        if (questionCard) questionCard.style.display = 'none';
        if (noBtn) {
          noBtn.classList.remove('is-dodging');
          noBtn.style.display = 'none';
        }
        if (yesResult) yesResult.style.display = 'flex';

        if ('vibrate' in navigator) {
          try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (_) {}
        }

        launchConfetti();
      });
    }

    function resetQuestionState() {
      if (questionCard) questionCard.style.display = 'flex';
      if (noBtn) {
        noBtn.classList.remove('is-dodging');
        noBtn.style.left = '';
        noBtn.style.top = '';
        noBtn.style.display = '';
      }
      if (noDodgeMsg) noDodgeMsg.textContent = '';
      if (yesResult) yesResult.style.display = 'none';
    }

    /* =====================================================
       PAGE 8 — REPLAY OUR STORY
       ===================================================== */
    if (replayBtn) {
      replayBtn.addEventListener('click', e => {
        e.preventDefault();
        closeLoveLetter();
        if (heartEnvelope) {
          heartEnvelope.classList.remove('is-open');
          heartEnvelope.setAttribute('aria-expanded', 'false');
        }
        resetQuestionState();
        storyHistory = [1];
        goTo(1, { isBack: true });
      });
    }

    /* =====================================================
       CONFETTI CELEBRATION (YES BUTTON EFFECT)
       ===================================================== */
    const confettiCanvas = document.getElementById('confetti-canvas');
    let confettiActive = false;

    function launchConfetti() {
      if (!confettiCanvas || reduceMotion || confettiActive) return;
      const ctx = confettiCanvas.getContext('2d');
      if (!ctx) return;

      confettiActive = true;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      confettiCanvas.width = w * dpr;
      confettiCanvas.height = h * dpr;
      confettiCanvas.style.width = `${w}px`;
      confettiCanvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colors = ['#ff5b8c', '#e6396f', '#ffd1dc', '#fff', '#f4cbb2', '#ff85a7'];
      const particles = Array.from({ length: 110 }, () => ({
        x: w / 2 + (Math.random() - 0.5) * 80,
        y: h * 0.45,
        vx: (Math.random() - 0.5) * 12,
        vy: -7 - Math.random() * 8,
        size: 5 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.25,
        isHeart: Math.random() < 0.4,
        life: 0,
        maxLife: 150 + Math.random() * 50
      }));

      function renderConfetti() {
        ctx.clearRect(0, 0, w, h);
        let activeCount = 0;

        particles.forEach(p => {
          p.life++;
          if (p.life > p.maxLife) return;
          activeCount++;

          p.vy += 0.22;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.vr;

          const alpha = Math.max(0, 1 - p.life / p.maxLife);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;

          if (p.isHeart) {
            ctx.font = `${p.size * 1.8}px serif`;
            ctx.fillText('❤', -p.size, p.size / 2);
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          }
          ctx.restore();
        });

        if (activeCount > 0) {
          requestAnimationFrame(renderConfetti);
        } else {
          ctx.clearRect(0, 0, w, h);
          confettiActive = false;
        }
      }

      requestAnimationFrame(renderConfetti);
    }

    /* =====================================================
       AMBIENT BACKGROUND PARTICLES CANVAS
       ===================================================== */
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas) {
      const ctx = bgCanvas.getContext('2d');
      let particles = [];
      let rafId = null;

      function resizeBgCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        bgCanvas.width = window.innerWidth * dpr;
        bgCanvas.height = window.innerHeight * dpr;
        bgCanvas.style.width = `${window.innerWidth}px`;
        bgCanvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function createParticle() {
        const isHeart = Math.random() < 0.4;
        return {
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + 10 + Math.random() * 60,
          size: isHeart ? 10 + Math.random() * 12 : 1.5 + Math.random() * 3,
          speed: 0.35 + Math.random() * 0.55,
          drift: (Math.random() - 0.5) * 0.35,
          opacity: 0.15 + Math.random() * 0.45,
          isHeart,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.015 + Math.random() * 0.02
        };
      }

      function initBgParticles() {
        const count = window.innerWidth < 600 ? 18 : 34;
        particles = Array.from({ length: count }, () => {
          const p = createParticle();
          p.y = Math.random() * window.innerHeight; // scatter on initial load
          return p;
        });
      }

      function drawAmbientHeart(x, y, size, opacity) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 22, size / 22);
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(0, 0, -8, -6, -10, -1);
        ctx.bezierCurveTo(-12, 4, -6, 8, 0, 15);
        ctx.bezierCurveTo(6, 8, 12, 4, 10, -1);
        ctx.bezierCurveTo(8, -6, 0, 0, 0, 4);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 91, 140, ${opacity})`;
        ctx.fill();
        ctx.restore();
      }

      function renderBg() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        particles.forEach(p => {
          p.y -= p.speed;
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 0.4 + p.drift;

          if (p.y < -30) {
            Object.assign(p, createParticle());
          }

          if (p.isHeart) {
            drawAmbientHeart(p.x, p.y, p.size, p.opacity);
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 230, 240, ${p.opacity * 0.9})`;
            ctx.shadowColor = 'rgba(255, 91, 140, 0.6)';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        rafId = requestAnimationFrame(renderBg);
      }

      resizeBgCanvas();
      initBgParticles();
      if (!reduceMotion) {
        rafId = requestAnimationFrame(renderBg);
      }

      window.addEventListener('resize', () => {
        resizeBgCanvas();
        initBgParticles();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (rafId) cancelAnimationFrame(rafId);
        } else if (!reduceMotion) {
          rafId = requestAnimationFrame(renderBg);
        }
      });
    }

    /* =====================================================
       ROMANTIC MUSIC (WEB AUDIO API SYNTH + MP3 FALLBACK)
       ===================================================== */
    const bgAudio = document.getElementById('bg-audio');
    const soundToggle = document.getElementById('sound-toggle');
    const iconMuted = document.getElementById('icon-muted');
    const iconPlaying = document.getElementById('icon-playing');

    let isAudioPlaying = false;
    let audioCtx = null;
    let synthTimer = null;

    // Soft Romantic Piano/Music-box Chords Arpeggio
    function startRomanticSynth() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!audioCtx) {
          audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        // F major -> C major -> D minor -> Bb major dreamy romantic sequence
        const chords = [
          [349.23, 440.00, 523.25, 659.25], // Fmaj7
          [261.63, 329.63, 392.00, 523.25], // C
          [293.66, 349.23, 440.00, 523.25], // Dm7
          [233.08, 293.66, 349.23, 440.00]  // Bbmaj7
        ];

        let chordIdx = 0;
        let noteIdx = 0;

        function playNote() {
          if (!isAudioPlaying || !audioCtx) return;
          const currentChord = chords[chordIdx];
          const freq = currentChord[noteIdx];

          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

          // Soft chime attack and gentle decay
          gain.gain.setValueAtTime(0, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.2);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start();
          osc.stop(audioCtx.currentTime + 2.3);

          noteIdx++;
          if (noteIdx >= currentChord.length) {
            noteIdx = 0;
            chordIdx = (chordIdx + 1) % chords.length;
          }

          synthTimer = setTimeout(playNote, 420);
        }

        playNote();
      } catch (err) {
        console.log('Audio synth error:', err);
      }
    }

    function stopRomanticSynth() {
      if (synthTimer) {
        clearTimeout(synthTimer);
        synthTimer = null;
      }
      if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend();
      }
    }

    async function toggleAudio() {
      if (!isAudioPlaying) {
        isAudioPlaying = true;
        soundToggle.setAttribute('aria-pressed', 'true');
        soundToggle.setAttribute('aria-label', 'Mute background music');
        if (iconMuted) iconMuted.style.display = 'none';
        if (iconPlaying) iconPlaying.style.display = 'block';

        // Try playing native MP3 first
        if (bgAudio) {
          bgAudio.volume = 0.5;
          bgAudio.play().then(() => {
            // Native audio played successfully
          }).catch(() => {
            // If MP3 404s or is blocked, seamlessly fallback to soft Web Audio synth
            startRomanticSynth();
          });
        } else {
          startRomanticSynth();
        }
      } else {
        isAudioPlaying = false;
        soundToggle.setAttribute('aria-pressed', 'false');
        soundToggle.setAttribute('aria-label', 'Play background music');
        if (iconMuted) iconMuted.style.display = 'block';
        if (iconPlaying) iconPlaying.style.display = 'none';

        if (bgAudio) {
          bgAudio.pause();
        }
        stopRomanticSynth();
      }
    }

    if (soundToggle) {
      soundToggle.addEventListener('click', toggleAudio);
    }

    /* =====================================================
       PAGE 6 — OUR PHOTOS GALLERY (LIGHTBOX / SLIDESHOW)
       ===================================================== */
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const galleryLightbox = document.getElementById('gallery-lightbox');
    const galleryBackdrop = document.getElementById('gallery-backdrop');
    const galleryLightboxImg = document.getElementById('gallery-lightbox-img');
    const galleryCounter = document.getElementById('gallery-counter');
    const galleryCloseBtn = document.getElementById('gallery-close');
    const galleryPrevBtn = document.getElementById('gallery-prev');
    const galleryNextBtn = document.getElementById('gallery-next');

    const galleryPhotos = galleryItems.map(item => {
      const img = item.querySelector('img');
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') };
    });

    let galleryCurrentIndex = 0;

    function showGalleryPhoto(index) {
      if (!galleryPhotos.length) return;
      galleryCurrentIndex = (index + galleryPhotos.length) % galleryPhotos.length;
      const photo = galleryPhotos[galleryCurrentIndex];
      if (galleryLightboxImg) {
        galleryLightboxImg.src = photo.src;
        galleryLightboxImg.alt = photo.alt || 'Our photo';
      }
      if (galleryCounter) {
        galleryCounter.textContent = `${galleryCurrentIndex + 1} / ${galleryPhotos.length}`;
      }
    }

    function openGalleryLightbox(index) {
      if (!galleryLightbox) return;
      showGalleryPhoto(index);
      galleryLightbox.style.display = 'flex';
    }

    function closeGalleryLightbox() {
      if (!galleryLightbox) return;
      galleryLightbox.style.display = 'none';
    }

    galleryItems.forEach((item, idx) => {
      item.addEventListener('click', () => openGalleryLightbox(idx));
    });

    if (galleryCloseBtn) galleryCloseBtn.addEventListener('click', closeGalleryLightbox);
    if (galleryBackdrop) galleryBackdrop.addEventListener('click', closeGalleryLightbox);
    if (galleryPrevBtn) galleryPrevBtn.addEventListener('click', () => showGalleryPhoto(galleryCurrentIndex - 1));
    if (galleryNextBtn) galleryNextBtn.addEventListener('click', () => showGalleryPhoto(galleryCurrentIndex + 1));

    document.addEventListener('keydown', e => {
      if (!galleryLightbox || galleryLightbox.style.display === 'none') return;
      if (e.key === 'Escape') {
        closeGalleryLightbox();
      } else if (e.key === 'ArrowRight') {
        showGalleryPhoto(galleryCurrentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        showGalleryPhoto(galleryCurrentIndex - 1);
      }
    });

    /* =====================================================
       KEYBOARD NAVIGATION
       ===================================================== */
    document.addEventListener('keydown', e => {
      const overlayOpen = (letterOverlay && letterOverlay.style.display !== 'none') ||
        (galleryLightbox && galleryLightbox.style.display !== 'none');
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (currentPage < totalPages && !overlayOpen) {
          goTo(currentPage + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentPage > 1 && !overlayOpen) {
          goTo(currentPage - 1, { isBack: true });
        }
      }
    });

    // Initialize Page 1
    updateProgress(1);

  });
})();