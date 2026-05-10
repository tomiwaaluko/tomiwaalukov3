import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiPlus } from 'react-icons/fi';
import { faqItems } from '../../data/servicesData';

const ServicesFAQ: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const header = el.querySelector('.faq-header');
      const items = el.querySelectorAll('.faq-item');
      const list = el.querySelector('.faq-list');

      if (header) {
        gsap.from(header, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        });
      }
      if (items.length) {
        gsap.from(items, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: list || el,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });
      }
    }, el);
    return () => ctx.revert();
  }, []);

  const toggle = (index: number) => {
    const isOpen = openIndex === index;
    const el = answerRefs.current[index];

    if (isOpen) {
      gsap.to(el, { height: 0, duration: 0.3, ease: 'power2.inOut', onComplete: () => setOpenIndex(null) });
    } else {
      // Close previous
      if (openIndex !== null) {
        const prev = answerRefs.current[openIndex];
        gsap.to(prev, { height: 0, duration: 0.3, ease: 'power2.inOut' });
      }
      setOpenIndex(index);
      gsap.set(el, { height: 'auto' });
      gsap.from(el, { height: 0, duration: 0.3, ease: 'power2.inOut' });
    }
  };

  return (
    <section ref={sectionRef} className="relative z-10 py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="faq-header">
          <p className="font-mono text-xs tracking-widest uppercase text-cream-500 dark:text-cream-400 mb-3">
            Questions
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-3 text-black dark:text-white">
            Before you reach out
          </h2>
          <p className="text-gray-500 font-light max-w-xs">
            Answers to the things most people ask before we start talking.
          </p>
        </div>

        <div className="faq-list">
          {faqItems.map((item, i) => (
            <div
              key={i}
              className="faq-item border-b border-black/10 dark:border-white/10"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between py-5 text-left group"
                style={{ cursor: 'none' }}
              >
                <span className="text-sm md:text-base font-semibold text-black dark:text-white pr-4">
                  {item.question}
                </span>
                <FiPlus
                  size={16}
                  className={`shrink-0 text-gray-400 transition-transform duration-300 ${
                    openIndex === i ? 'rotate-45' : ''
                  }`}
                />
              </button>
              <div
                ref={(el) => { answerRefs.current[i] = el; }}
                className="overflow-hidden"
                style={{ height: 0 }}
              >
                <p className="pb-5 text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesFAQ;
