import React, { useEffect, useRef, useState } from 'react';
import { FiArrowUpRight } from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../data/projects';
import { TextScramble } from '../lib/textScramble';

/** 0 = waiting; 1 = scrambling ID; 2 = scrambling title; 3 = done */
type ScramblePhase = 0 | 1 | 2 | 3;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return reduced;
}

type ProjectDataSheetRowProps = {
  project: Project;
  index: number;
  isHighlight: boolean;
  isUiUxPractice: boolean;
};

/**
 * Projects index row: ID and title use soulwire-style scramble when the row enters the viewport,
 * ID first then title. Replays when the row leaves and re-enters (same pattern as hero meta).
 */
const ProjectDataSheetRow: React.FC<ProjectDataSheetRowProps> = ({
  project,
  index,
  isHighlight,
  isUiUxPractice,
}) => {
  const navigate = useNavigate();
  const rowRef = useRef<HTMLDivElement>(null);
  const idRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const fxIdRef = useRef<TextScramble | null>(null);
  const fxTitleRef = useRef<TextScramble | null>(null);
  const seenIntersectingRef = useRef(false);
  const leftSinceSeenRef = useRef(false);

  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<ScramblePhase>(0);

  const idStr = String(index + 1).padStart(2, '0');
  const titleStr = project.title;

  useEffect(() => {
    if (reducedMotion) setPhase(3);
  }, [reducedMotion]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible =
          entry.isIntersecting &&
          entry.intersectionRatio > 0.06 &&
          entry.boundingClientRect.height > 0;

        if (!visible) {
          if (seenIntersectingRef.current) leftSinceSeenRef.current = true;
          fxIdRef.current?.cancel();
          fxTitleRef.current?.cancel();
          setPhase(0);
          return;
        }

        seenIntersectingRef.current = true;

        if (reducedMotion) {
          setPhase(3);
          return;
        }

        if (leftSinceSeenRef.current) {
          leftSinceSeenRef.current = false;
          setPhase(1);
          return;
        }

        setPhase((p) => (p === 0 ? 1 : p));
      },
      { threshold: [0, 0.08, 0.15], rootMargin: '0px 0px -6% 0px' }
    );

    observer.observe(row);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (phase !== 1 || reducedMotion) return;
    const el = idRef.current;
    if (!el) return;

    fxIdRef.current?.cancel();
    const fx = new TextScramble(el);
    fxIdRef.current = fx;
    fx.setText(idStr).then(() => {
      fxIdRef.current = null;
      setPhase(2);
    });

    return () => {
      fx.cancel();
      fxIdRef.current = null;
    };
  }, [phase, reducedMotion, idStr]);

  useEffect(() => {
    if (phase !== 2 || reducedMotion) return;
    const el = titleRef.current;
    if (!el) return;

    fxTitleRef.current?.cancel();
    const fx = new TextScramble(el);
    fxTitleRef.current = fx;
    fx.setText(titleStr).then(() => {
      fxTitleRef.current = null;
      setPhase(3);
    });

    return () => {
      fx.cancel();
      fxTitleRef.current = null;
    };
  }, [phase, reducedMotion, titleStr]);

  const showStatic = reducedMotion || phase >= 3;

  return (
    <div
      ref={rowRef}
      onClick={() => navigate(`/projects/${project.id}`)}
      onMouseEnter={(e) => {
        const v = e.currentTarget.querySelector('video[data-list-hover]') as HTMLVideoElement | null;
        if (v) void v.play().catch(() => {});
      }}
      onMouseLeave={(e) => {
        const v = e.currentTarget.querySelector('video[data-list-hover]') as HTMLVideoElement | null;
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      }}
      className="grid-cell group grid grid-cols-1 md:grid-cols-12 gap-0 border-b border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors duration-300 cursor-pointer overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gray-100 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="col-span-12 md:col-span-1 py-6 md:py-8 flex items-center justify-center font-mono text-xs text-gray-400 group-hover:text-black dark:group-hover:text-white relative z-10">
        {showStatic ? (
          idStr
        ) : phase === 1 ? (
          <div ref={idRef} className="inline-block min-w-[2ch] tabular-nums" aria-label={idStr} />
        ) : (
          idStr
        )}
      </div>

      <div className="col-span-12 md:col-span-5 py-6 md:py-8 px-4 flex items-center gap-6 relative z-10">
        <div className="relative w-16 h-16 md:w-24 md:h-16 bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
          {project.listHoverVideo ? (
            <>
              <img
                src={project.image}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: project.imageObjectPosition ?? 'center' }}
              />
              <video
                data-list-hover
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                muted
                playsInline
                loop
                preload="metadata"
                poster={project.image}
                aria-hidden
              >
                <source src={project.listHoverVideo} type="video/mp4" />
              </video>
            </>
          ) : (
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover"
              style={{ objectPosition: project.imageObjectPosition ?? 'center' }}
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 md:gap-3">
            <h2 className="text-2xl md:text-3xl font-light tracking-tight group-hover:translate-x-2 transition-transform duration-300">
              {showStatic ? (
                titleStr
              ) : phase === 2 ? (
                <span ref={titleRef} className="inline-block min-w-[4ch]" aria-label={titleStr} />
              ) : (
                <span className="inline-block select-none opacity-0 pointer-events-none" aria-hidden>
                  {'\u00a0'}
                </span>
              )}
            </h2>
            {isHighlight && (
              <AiFillStar
                className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]"
                aria-label="Highlighted project"
                title="Highlighted project"
              />
            )}
            {isUiUxPractice && (
              <AiFillStar
                className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.45)]"
                aria-label="Frontend UI/UX practice project"
                title="Frontend UI/UX practice project"
              />
            )}
          </div>
          <span className="md:hidden font-mono text-xs text-gray-400 uppercase tracking-widest mt-1 block">
            {project.category}
          </span>
        </div>
      </div>

      <div className="hidden md:flex col-span-4 py-8 items-center relative z-10">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {project.tech.slice(0, 3).map((t, i) => (
            <span key={i} className="font-mono text-xs text-gray-500 dark:text-gray-400 uppercase">
              {t}
            </span>
          ))}
          {project.tech.length > 3 && (
            <span className="font-mono text-xs text-gray-400 uppercase">+ {project.tech.length - 3}</span>
          )}
        </div>
      </div>

      <div className="hidden md:flex col-span-2 py-8 px-4 items-center justify-end font-mono text-sm relative z-10">
        <span className="mr-4 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
          {project.year}
        </span>
        <FiArrowUpRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </div>
    </div>
  );
};

export default ProjectDataSheetRow;
