import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useTronTheme } from '../context/TronThemeContext';

type HitMode = 'default' | 'interactive-link' | 'interactive-button' | 'heading';

function classifyHit(el: Element | null): HitMode {
  if (!el || !(el instanceof Element)) return 'default';
  // Featured project titles: same cursor treatment as nav tabs (large ring), not the giant heading mode.
  if (el.closest('[data-cursor="featured"]')) return 'interactive-link';
  const inHeading = el.closest('h1, h2, h3');
  if (inHeading && !inHeading.closest('[data-cursor="featured"]')) return 'heading';
  if (el.closest('a')) return 'interactive-link';
  if (el.closest('button, [data-cursor="pointer"]')) return 'interactive-button';
  return 'default';
}

const ACCENT = {
  creamDot: '#C4A572',
  creamRing: '#8B7355',
  creamLinkText: '#A68B5B',
  tronDot: '#41f3f1',
  tronRing: '#41f3f1',
  tronLinkText: '#41f3f1',
} as const;

const CustomCursor: React.FC = () => {
  const { isTronTheme } = useTronTheme();
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const lastPointerKeyRef = useRef('');
  const lastTintedLinkRef = useRef<HTMLAnchorElement | null>(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const determineTouchDevice = () => {
      if (mediaQuery.matches) {
        setIsTouchDevice(true);
      }
    };
    determineTouchDevice();
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;

    if (!cursor || !follower) return;

    gsap.set([cursor, follower], {
      xPercent: -50,
      yPercent: -50,
      transformOrigin: '50% 50%',
    });

    const clearLinkTint = () => {
      if (lastTintedLinkRef.current) {
        lastTintedLinkRef.current.style.color = '';
        lastTintedLinkRef.current = null;
      }
    };

    const applyHitMode = (mode: HitMode, anchorForTint: HTMLAnchorElement | null) => {
      const tron = isTronTheme;

      if (mode === 'default') {
        clearLinkTint();
        gsap.to(cursor, { backgroundColor: '', scale: 1, duration: 0.2 });
        gsap.to(follower, { borderColor: '', scale: 1, duration: 0.2 });
        return;
      }

      if (mode === 'heading') {
        clearLinkTint();
        gsap.to(cursor, { backgroundColor: '', scale: 19.5, duration: 0.3 });
        gsap.to(follower, { borderColor: '', scale: 5, duration: 0.3 });
        return;
      }

      if (mode === 'interactive-link') {
        gsap.to(cursor, {
          backgroundColor: tron ? ACCENT.tronDot : ACCENT.creamDot,
          scale: 5.8,
          duration: 0.2,
        });
        gsap.to(follower, {
          borderColor: tron ? ACCENT.tronRing : ACCENT.creamRing,
          scale: 1.5,
          duration: 0.2,
        });
        if (anchorForTint) {
          if (lastTintedLinkRef.current && lastTintedLinkRef.current !== anchorForTint) {
            lastTintedLinkRef.current.style.color = '';
          }
          lastTintedLinkRef.current = anchorForTint;
          anchorForTint.style.color = tron ? ACCENT.tronLinkText : ACCENT.creamLinkText;
        }
        return;
      }

      // interactive-button
      clearLinkTint();
      gsap.to(cursor, { backgroundColor: '', scale: 5.8, duration: 0.3 });
      gsap.to(follower, { borderColor: '', scale: 1.5, duration: 0.3 });
    };

    const moveCursor = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.06,
        overwrite: 'auto',
      });
      gsap.to(follower, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.18,
        overwrite: 'auto',
      });

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const mode = classifyHit(el);
      const anchorForTint =
        mode === 'interactive-link' && el ? el.closest('a') : null;
      const key = `${mode}:${anchorForTint?.href ?? ''}`;
      if (key === lastPointerKeyRef.current) return;
      lastPointerKeyRef.current = key;
      applyHitMode(mode, anchorForTint);
    };

    document.addEventListener('mousemove', moveCursor);

    return () => {
      gsap.killTweensOf([cursor, follower]);
      document.removeEventListener('mousemove', moveCursor);
      clearLinkTint();
      lastPointerKeyRef.current = '';
    };
  }, [isTouchDevice, isTronTheme]);

  if (isTouchDevice) {
    return null;
  }

  return (
    <>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 rounded-full bg-gray-700 mix-blend-difference dark:bg-gray-100"
      />
      <div
        ref={followerRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-8 w-8 rounded-full border border-gray-700 mix-blend-difference dark:border-gray-100"
      />
    </>
  );
};

export default CustomCursor;
