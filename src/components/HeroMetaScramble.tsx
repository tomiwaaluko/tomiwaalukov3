import React, { useEffect, useRef, useState } from 'react';
import { TextScramble } from '../lib/textScramble';

const META_LINES = [
  'SOFTWARE ENGINEER',
  'NSBE | APA | COLORSTACK',
  'UNIV. OF CENTRAL FLORIDA',
  'BASED IN',
  'ORLANDO, FLORIDA',
  'MIAMI, FLORIDA',
] as const;

type HeroMetaScrambleProps = {
  /** False until the shell is visible (e.g. intro loader finished). Scramble waits so it does not run behind the loader. */
  contentReady?: boolean;
  /** Wait before starting the first line (e.g. sync with hero fade-in). */
  startDelayMs?: number;
  /** Pause between finishing one line and starting the next. */
  betweenLinesMs?: number;
};

/**
 * Right-aligned hero meta block: soulwire-style scramble reveals one line at a time.
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function HeroMetaScramble({
  contentReady = true,
  startDelayMs = 800,
  betweenLinesMs = 120,
}: HeroMetaScrambleProps) {
  const [phase, setPhase] = useState(() =>
    prefersReducedMotion() ? META_LINES.length : 0
  );
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<TextScramble | null>(null);
  /** True once this block has been intersecting at least once (avoids “replay” on first scroll-into-view when hero starts below fold). */
  const seenIntersectingRef = useRef(false);
  /** True after user scrolled away since last time this block was visible. */
  const leftSinceSeenRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) setPhase(META_LINES.length);
  }, [reducedMotion]);

  /** Stop scramble while waiting on loader; reset phase when gated off mid-run. */
  useEffect(() => {
    if (contentReady) return;
    fxRef.current?.cancel();
    setPhase(reducedMotion ? META_LINES.length : 0);
  }, [contentReady, reducedMotion]);

  /** When the meta block leaves the viewport and comes back, restart the line-by-line scramble. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible =
          entry.isIntersecting &&
          entry.intersectionRatio > 0.06 &&
          entry.boundingClientRect.height > 0;

        if (!visible) {
          if (seenIntersectingRef.current) leftSinceSeenRef.current = true;
          return;
        }

        seenIntersectingRef.current = true;

        if (reducedMotion || !contentReady) return;

        if (leftSinceSeenRef.current) {
          leftSinceSeenRef.current = false;
          fxRef.current?.cancel();
          setPhase(0);
        }
      },
      { threshold: [0, 0.08, 0.15], rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [reducedMotion, contentReady]);

  useEffect(() => {
    if (!contentReady || reducedMotion) return;
    if (phase >= META_LINES.length) return;

    let idleTimer: number | undefined;

    const startLine = () => {
      const el = activeRef.current;
      if (!el) return;

      fxRef.current?.cancel();
      const fx = new TextScramble(el);
      fxRef.current = fx;

      const line = META_LINES[phase];
      fx.setText(line).then(() => {
        fxRef.current = null;
        idleTimer = window.setTimeout(() => {
          setPhase((p) => p + 1);
        }, betweenLinesMs);
      });
    };

    if (phase === 0 && startDelayMs > 0) {
      const t = window.setTimeout(startLine, startDelayMs);
      return () => {
        window.clearTimeout(t);
        if (idleTimer !== undefined) window.clearTimeout(idleTimer);
        fxRef.current?.cancel();
      };
    }

    startLine();

    return () => {
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      fxRef.current?.cancel();
    };
  }, [phase, reducedMotion, contentReady, startDelayMs, betweenLinesMs]);

  const renderLine = (i: number) => {
    const text = META_LINES[i];
    if (!contentReady && reducedMotion) {
      return (
        <div key={i} className="hero-meta-line">
          {text}
        </div>
      );
    }
    if (!contentReady) {
      return (
        <div key={i} className="hero-meta-line hero-meta-line--pending" aria-hidden>
          {'\u00a0'}
        </div>
      );
    }
    if (reducedMotion || i < phase) {
      return (
        <div key={i} className="hero-meta-line">
          {text}
        </div>
      );
    }
    if (i === phase) {
      return (
        <div
          key={i}
          ref={activeRef}
          className="hero-meta-line hero-meta-line--active"
          aria-label={text}
        />
      );
    }
    return (
      <div key={i} className="hero-meta-line hero-meta-line--pending" aria-hidden>
        {'\u00a0'}
      </div>
    );
  };

  return (
    <div ref={rootRef} className="hero-meta-scramble-root">
      <style>{`
        .hero-meta-scramble-root {
          width: 100%;
        }
        .hero-meta .text-scramble-dud {
          opacity: 0.42;
        }
        .dark .hero-meta .text-scramble-dud {
          opacity: 0.5;
        }
        .hero-meta-line {
          min-height: 1.5em;
        }
        .hero-meta-line--pending {
          user-select: none;
        }
      `}</style>
      <p>
        {renderLine(0)}
        {renderLine(1)}
        {renderLine(2)}
      </p>
      <p className="meta-gap">
        {renderLine(3)}
        {renderLine(4)}
        {renderLine(5)}
      </p>
    </div>
  );
}
