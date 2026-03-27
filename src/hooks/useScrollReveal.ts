import { useEffect, useRef } from 'react';

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  // Re-run when DOM changes
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '50px 0px 0px 0px' }
    );

    const observeItems = () => {
      const items = container.querySelectorAll('.scroll-reveal-item:not(.scroll-revealed)');
      items.forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${(i % 4) * 60}ms`;
        observer.observe(child);
      });
    };

    // Small delay to ensure DOM is painted
    requestAnimationFrame(() => {
      observeItems();
    });

    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(() => observeItems());
    });
    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  });

  return ref;
}
