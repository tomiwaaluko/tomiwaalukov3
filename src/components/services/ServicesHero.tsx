import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface ServicesHeroProps {
  onScrollToPricing: () => void;
  onScrollToForm: () => void;
}

const ServicesHero: React.FC<ServicesHeroProps> = ({ onScrollToPricing, onScrollToForm }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-word', {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        stagger: 0.1,
      });
      gsap.from('.hero-sub', {
        y: 20,
        opacity: 0,
        duration: 1,
        delay: 0.6,
        ease: 'power2.out',
      });
      gsap.from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 1,
        delay: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative z-10 pt-32 pb-20 px-6 md:px-12 max-w-[1800px] mx-auto">
      <div className="border-b border-black dark:border-white pb-6 mb-12">
        <h1 className="text-[14vw] leading-[0.8] font-bold tracking-tighter uppercase mix-blend-difference text-black dark:text-white">
          <span className="hero-word block">Build</span>
          <span className="hero-word block">With Me_</span>
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6 lg:col-span-5">
          <p className="hero-sub font-mono text-sm leading-relaxed uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Freelance web development &<br />
            full-stack engineering.<br />
            From landing pages to platforms.
          </p>
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4 lg:col-start-9 flex flex-col sm:flex-row gap-4 items-start md:items-end md:justify-end">
          <button
            onClick={onScrollToPricing}
            className="hero-cta px-6 py-3 text-xs font-mono uppercase tracking-widest border border-black/10 dark:border-white/10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
            style={{ cursor: 'none' }}
          >
            View Pricing
          </button>
          <button
            onClick={onScrollToForm}
            className="hero-cta px-6 py-3 text-xs font-mono uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black hover:bg-cream-500 hover:text-black transition-all duration-300"
            style={{ cursor: 'none' }}
          >
            Start a Project
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServicesHero;
