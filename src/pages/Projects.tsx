import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AiFillStar } from 'react-icons/ai';
import { projects } from '../data/projects';
import Footer from '../components/Footer';
import ProjectDataSheetRow from '../components/ProjectDataSheetRow';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/** Gold star — highlighted projects */
const HIGHLIGHT_PROJECT_IDS = new Set([
  'agent-a-thon-nsbe-2026',
  'chalk',
  'civic-lens',
  'nsbe-app',
  'rom-com',
  'standin',
  'ucf-alphas-website',
]);

/** Blue star — frontend UI/UX practice builds */
const UI_UX_PRACTICE_PROJECT_IDS = new Set(['frontend-testing']);

const Projects: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.from('.hero-word', {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        stagger: 0.1
      });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">

      {/* Swiss Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="w-full h-full grid grid-cols-6 lg:grid-cols-12 gap-0">
          {[...Array(13)].map((_, i) => (
            <div key={i} className="h-full w-px bg-black/5 dark:bg-white/5 mx-auto" />
          ))}
        </div>
      </div>

      {/* Hero Section: Monumental Typography */}
      <section className="relative z-10 pt-32 pb-20 px-6 md:px-12 max-w-[1800px] mx-auto">
        <div className="border-b border-black dark:border-white pb-6 mb-12">
          <h1 className="text-[14vw] leading-[0.8] font-bold tracking-tighter uppercase mix-blend-difference text-black dark:text-white">
            <span className="hero-word block">Projects_</span>
          </h1>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <p className="font-mono text-sm leading-relaxed uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Directory of Technical Solutions<br />
              System Architectures &<br />
              Full-Stack Implementations
            </p>
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4 lg:col-start-9 text-right">
            <p className="font-mono text-xs uppercase tracking-widest text-gray-400 dark:text-gray-600">
              Index v2.4 · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </section>

      {/* Datasheet Grid */}
      <section className="relative z-10 px-6 md:px-12 pb-32 max-w-[1800px] mx-auto">

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-0 border-b border-black dark:border-white py-2 font-mono text-xs uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-0">
          <div className="col-span-1 md:col-span-1 text-center">ID</div>
          <div className="col-span-8 md:col-span-5">Project Name</div>
          <div className="hidden md:block col-span-4">Tech Stack</div>
          <div className="hidden md:block col-span-2 text-right">Year</div>
        </div>

        <style>{`
          .projects-grid .text-scramble-dud { opacity: 0.42; }
          .dark .projects-grid .text-scramble-dud { opacity: 0.5; }
        `}</style>
        <div className="projects-grid">
          {projects.map((project, index) => (
            <ProjectDataSheetRow
              key={project.id}
              project={project}
              index={index}
              isHighlight={HIGHLIGHT_PROJECT_IDS.has(project.id)}
              isUiUxPractice={UI_UX_PRACTICE_PROJECT_IDS.has(project.id)}
            />
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 relative z-10">
          <p className="font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
            Legend
          </p>
          <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-10 font-mono text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-2.5">
              <AiFillStar className="w-4 h-4 shrink-0 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" aria-hidden />
              <span>Gold star — highlighted project</span>
            </li>
            <li className="flex items-center gap-2.5">
              <AiFillStar className="w-4 h-4 shrink-0 text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]" aria-hidden />
              <span>Blue star — practicing frontend UI/UX development</span>
            </li>
          </ul>
        </div>

      </section>
      <Footer />
    </div>
  );
};

export default Projects;