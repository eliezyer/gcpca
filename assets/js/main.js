const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const copyStatus = document.getElementById('copy-status');
const backToTopButton = document.querySelector('.back-to-top');
const navLinks = Array.from(document.querySelectorAll('.site-nav a'));
const revealElements = document.querySelectorAll('[data-reveal]');
const lightbox = document.getElementById('lightbox');
const lightboxImage = lightbox?.querySelector('.lightbox-image');
const lightboxCaption = lightbox?.querySelector('.lightbox-caption');
let lastFocusedElement = null;

const setCopyStatus = (message) => {
  if (copyStatus) {
    copyStatus.textContent = message;
  }
};

const fallbackCopy = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'absolute';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  const didCopy = document.execCommand('copy');
  document.body.removeChild(textArea);
  return didCopy;
};

const handleCopy = async (button) => {
  const targetId = button.dataset.copyTarget;
  const target = targetId ? document.getElementById(targetId) : null;
  const text = target ? target.innerText.trim() : button.dataset.copyText;

  if (!text) {
    return;
  }

  let copied = false;

  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch (error) {
    copied = fallbackCopy(text);
  }

  if (!copied) {
    setCopyStatus('Copy failed.');
    return;
  }

  const originalText = button.textContent;
  button.textContent = 'Copied';
  button.classList.add('is-copied');
  setCopyStatus('Copied to clipboard.');

  window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove('is-copied');
  }, 1800);
};

document.querySelectorAll('.copy-button').forEach((button) => {
  button.addEventListener('click', () => {
    handleCopy(button);
  });
});

if (backToTopButton) {
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  const toggleBackToTop = () => {
    backToTopButton.classList.toggle('is-visible', window.scrollY > 720);
  };

  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
}

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && sections.length > 0) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleSection) {
        return;
      }

      navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${visibleSection.target.id}`;
        link.classList.toggle('is-active', isActive);
      });
    },
    {
      rootMargin: '-40% 0px -45% 0px',
      threshold: [0.1, 0.35, 0.6]
    }
  );

  sections.forEach((section) => navObserver.observe(section));
}

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.15
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const openLightbox = (trigger) => {
  if (!lightbox || !lightboxImage || !lightboxCaption || trigger.disabled) {
    return;
  }

  const imageSrc = trigger.dataset.imageSrc;
  const imageAlt = trigger.dataset.imageAlt || '';
  const imageCaption = trigger.dataset.imageCaption || '';

  if (!imageSrc) {
    return;
  }

  lastFocusedElement = document.activeElement;
  lightboxImage.src = imageSrc;
  lightboxImage.alt = imageAlt;
  lightboxCaption.textContent = imageCaption;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  lightbox.querySelector('.lightbox-close')?.focus();
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage || !lightboxCaption) {
    return;
  }

  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  lightboxImage.src = '';
  lightboxImage.alt = '';
  lightboxCaption.textContent = '';

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
};

document.querySelectorAll('.js-lightbox-trigger').forEach((trigger) => {
  const image = trigger.querySelector('.figure-image');
  const placeholder = trigger.querySelector('.figure-placeholder');

  const showPlaceholder = () => {
    trigger.classList.add('is-missing');
    trigger.disabled = true;

    if (placeholder) {
      placeholder.hidden = false;
      placeholder.textContent = trigger.dataset.placeholderLabel || 'Image placeholder';
      placeholder.classList.add('is-visible');
    }
  };

  const markReady = () => {
    trigger.classList.add('is-ready');
  };

  if (!image) {
    showPlaceholder();
    return;
  }

  if (image.complete && image.naturalWidth > 0) {
    markReady();
  } else if (image.complete && image.naturalWidth === 0) {
    showPlaceholder();
  } else {
    image.addEventListener('load', markReady, { once: true });
    image.addEventListener('error', showPlaceholder, { once: true });
  }

  trigger.addEventListener('click', () => {
    if (trigger.classList.contains('is-ready')) {
      openLightbox(trigger);
    }
  });
});

if (lightbox) {
  lightbox.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.hasAttribute('data-close-lightbox')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
}
