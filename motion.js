(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const desktopMotion = window.matchMedia('(min-width: 851px)');
  const projectImage = document.querySelector('.project-image img');
  const themeToggle = document.querySelector('.theme-toggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let projectImageTop = 0;
  let frame = 0;

  const updateThemeControl = () => {
    const isDark = root.dataset.theme === 'dark';
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    themeToggle?.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    themeColor?.setAttribute('content', isDark ? '#0c1522' : '#111e30');
  };

  themeToggle?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('portfolio-theme', root.dataset.theme);
    } catch (error) {
      // The theme still applies for this visit when storage is unavailable.
    }
    updateThemeControl();
  });
  updateThemeControl();

  const measure = () => {
    projectImageTop = projectImage ? projectImage.getBoundingClientRect().top + window.scrollY : 0;
  };

  const updateMotion = () => {
    const scrollY = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    root.style.setProperty('--scroll-progress', height > 0 ? scrollY / height : 0);
    root.classList.toggle('page-scrolled', scrollY > 32);

    if (!reduceMotion && desktopMotion.matches) {
      if (projectImage) {
        const distance = scrollY + window.innerHeight * 0.5 - projectImageTop;
        const offset = Math.max(-12, Math.min(12, distance * 0.018));
        projectImage.style.setProperty('--image-parallax', `${offset.toFixed(2)}px`);
      }
    } else {
      projectImage?.style.setProperty('--image-parallax', '0px');
    }
    frame = 0;
  };

  const queueMotionUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(updateMotion);
  };

  measure();
  updateMotion();
  window.addEventListener('scroll', queueMotionUpdate, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    queueMotionUpdate();
  });

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('.project-carousel-track');
    const slides = [...carousel.querySelectorAll('.project-carousel-slide')];
    const dots = [...carousel.querySelectorAll('[data-carousel-go-to]')];
    const currentLabel = carousel.querySelector('[data-carousel-current]');
    let currentIndex = 0;
    let autoplayTimer = 0;
    let isVisible = !('IntersectionObserver' in window);
    let isHovered = false;
    let isFocused = false;

    if (!track || slides.length < 2) return;

    const stopAutoplay = () => {
      window.clearInterval(autoplayTimer);
      autoplayTimer = 0;
    };

    const showSlide = (requestedIndex, announce = false) => {
      currentIndex = (requestedIndex + slides.length) % slides.length;
      carousel.style.setProperty('--carousel-offset', `${currentIndex * -100}%`);
      slides.forEach((slide, index) => slide.setAttribute('aria-hidden', String(index !== currentIndex)));
      dots.forEach((dot, index) => {
        const active = index === currentIndex;
        dot.classList.toggle('is-current', active);
        dot.setAttribute('aria-pressed', String(active));
      });
      if (currentLabel) {
        currentLabel.parentElement?.setAttribute('aria-live', announce ? 'polite' : 'off');
        currentLabel.textContent = String(currentIndex + 1);
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (reduceMotion || !isVisible || isHovered || isFocused || document.hidden) return;
      autoplayTimer = window.setInterval(() => showSlide(currentIndex + 1), 7000);
    };

    const selectManually = (index) => {
      showSlide(index, true);
      startAutoplay();
    };

    carousel.querySelector('[data-carousel-previous]')?.addEventListener('click', () => selectManually(currentIndex - 1));
    carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => selectManually(currentIndex + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => selectManually(Number(dot.dataset.carouselGoTo))));

    carousel.addEventListener('mouseenter', () => {
      isHovered = true;
      stopAutoplay();
    });
    carousel.addEventListener('mouseleave', () => {
      isHovered = false;
      startAutoplay();
    });
    carousel.addEventListener('focusin', () => {
      isFocused = true;
      stopAutoplay();
    });
    carousel.addEventListener('focusout', () => {
      window.setTimeout(() => {
        isFocused = carousel.contains(document.activeElement);
        startAutoplay();
      }, 0);
    });
    document.addEventListener('visibilitychange', startAutoplay);

    if ('IntersectionObserver' in window) {
      const carouselObserver = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        startAutoplay();
      }, { threshold: 0.25 });
      carouselObserver.observe(carousel);
    }

    showSlide(0);
    startAutoplay();
  });

  if (reduceMotion || !('IntersectionObserver' in window)) return;

  root.classList.add('motion-enabled');
  const revealGroups = [
    '.section-heading', '.project', '.about > div', 'footer', '.project-image'
  ];
  const revealElements = [...document.querySelectorAll(revealGroups.join(','))];
  revealElements.forEach((element) => element.classList.add(element.matches('.project-image') ? 'image-reveal' : 'reveal'));
  const sequenceElements = [...document.querySelectorAll('.section-rule, .contact-sequence')];
  const elements = [...new Set([...revealElements, ...sequenceElements])];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, {
    threshold: 0.01,
    rootMargin: '0px 0px -18%'
  });
  elements.forEach((element) => observer.observe(element));

  const navLinks = [...document.querySelectorAll('nav a[href^="#"]')];
  const sections = [...document.querySelectorAll('#work, #about, #contact')];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle('is-current', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-32% 0px -58%', threshold: 0 });
  sections.forEach((section) => sectionObserver.observe(section));

  document.querySelectorAll('details').forEach((details) => {
    const summary = details.querySelector('summary');
    summary.addEventListener('click', (event) => {
      if (!details.open) return;
      event.preventDefault();
      const startHeight = details.offsetHeight;
      const endHeight = summary.offsetHeight;
      const content = [...details.children].filter((child) => child !== summary);
      details.classList.add('is-closing');
      details.animate([
        { height: `${startHeight}px` },
        { height: `${endHeight}px` }
      ], { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)' }).finished.then(() => {
        details.open = false;
        details.classList.remove('is-closing');
      });
      const contentAnimations = content.map((child) => child.animate([
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-6px)' }
      ], { duration: 210, easing: 'ease-out', fill: 'forwards' }));
      contentAnimations[0]?.finished.then(() => contentAnimations.forEach((animation) => animation.cancel()));
    });
  });
})();
