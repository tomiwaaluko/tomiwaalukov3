import React, { useEffect, useRef, useState } from 'react';

const CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*+-=?/<>[]{}';

function randomChar(): string {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)] ?? 'X';
}

/** Same length as mask; keeps spaces; never reveals the mask characters. */
function scrambleFromMask(mask: string): string {
  let out = '';
  for (let i = 0; i < mask.length; i++) {
    const c = mask[i];
    out += c === ' ' ? ' ' : randomChar();
  }
  return out;
}

type ConstantScrambleTextProps = {
  /** Used only for length and space positions; characters are never shown. */
  mask: string;
  className?: string;
  /** ms between updates while in view */
  tickMs?: number;
  /** Accessible name for the obfuscated segment */
  ariaLabel?: string;
};

/**
 * Continuous random scramble while intersecting the viewport; freezes when scrolled away.
 */
const ConstantScrambleText: React.FC<ConstantScrambleTextProps> = ({
  mask,
  className,
  tickMs = 42,
  ariaLabel = 'Details withheld',
}) => {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(() => scrambleFromMask(mask));
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    const id = window.setInterval(() => {
      setText(scrambleFromMask(mask));
    }, tickMs);

    return () => clearInterval(id);
  }, [inView, mask, tickMs]);

  return (
    <span
      ref={rootRef}
      className={className}
      aria-label={ariaLabel}
    >
      {text}
    </span>
  );
};

export default ConstantScrambleText;
