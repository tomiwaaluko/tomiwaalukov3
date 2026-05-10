import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
// @ts-ignore
import TransitionLink from '../TransitionLink';
import { projects } from '../../data/projects';

const FEATURED_IDS = ['ucf-alphas-website', 'frontend-testing', 'nsbe-app'];

const WorkShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const featured = FEATURED_IDS.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as typeof projects;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.set('.showcase-card', { y: 0, opacity: 1 });

    const cards = el.querySelectorAll('.showcase-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          gsap.fromTo(
            cards,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
          );
          observer.disconnect();
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = e.currentTarget.querySelector('video[data-list-hover]') as HTMLVideoElement | null;
    if (v) void v.play().catch(() => {});
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = e.currentTarget.querySelector('video[data-list-hover]') as HTMLVideoElement | null;
    if (v) { v.pause(); v.currentTime = 0; }
  };

  return (
    <section ref={sectionRef} className="relative z-10 py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">
        <p className="font-mono text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-12">
          Selected Work
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((project) => (
            <div
              key={project.id}
              className="showcase-card group relative overflow-hidden border border-black/10 dark:border-white/10 aspect-[4/3] bg-gray-100 dark:bg-gray-900"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Static thumbnail */}
              <img
                src={project.image}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={project.imageObjectPosition ? { objectPosition: project.imageObjectPosition } : undefined}
              />

              {/* Hover video — fades in on hover, same pattern as project list */}
              {project.listHoverVideo && (
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
              )}

              {/* Overlay with title — links to project detail */}
              <TransitionLink
                to={`/projects/${project.id}`}
                className="absolute inset-0 flex items-end"
                style={{ cursor: 'none' }}
              >
                <div className="w-full bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5">
                  <div className="translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-cream-400 mb-1">
                      {project.category}
                    </p>
                    <h3 className="text-lg font-bold text-white leading-tight">{project.title}</h3>
                  </div>
                </div>
              </TransitionLink>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <TransitionLink
            to="/projects"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-colors duration-300 group"
            style={{ cursor: 'none' }}
          >
            View All Projects
            <span className="group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
          </TransitionLink>
        </div>
      </div>
    </section>
  );
};

export default WorkShowcase;
