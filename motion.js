(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const updateProgress = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    root.style.setProperty('--scroll-progress', height > 0 ? window.scrollY / height : 0);
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  if (reduceMotion || !('IntersectionObserver' in window)) return;

  root.classList.add('motion-enabled');
  const revealGroups = [
    '.section-heading', '.project', '.about > div', '.contact .eyebrow',
    '.contact-row', 'footer', '.project img'
  ];
  const elements = [...document.querySelectorAll(revealGroups.join(','))];
  elements.forEach((element) => element.classList.add(element.matches('.project img') ? 'image-reveal' : 'reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, {
    threshold: 0.01,
    rootMargin: '0px 0px -18%'
  });
  elements.forEach((element) => observer.observe(element));
})();
