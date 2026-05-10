import type Lenis from 'lenis';

let lenisRef: Lenis | null = null;

export function registerLenis(lenis: Lenis | null): void {
  lenisRef = lenis;
}

/** Scroll to top — uses Lenis when available so smooth-scroll stays in sync. */
export function scrollPageTop(): void {
  if (lenisRef) {
    lenisRef.scrollTo(0, { immediate: true });
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
