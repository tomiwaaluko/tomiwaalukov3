import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { FiCheck, FiClock, FiInfo } from 'react-icons/fi';
import { pricingTiers, addOns } from '../../data/servicesData';

interface PricingSectionProps {
  onScrollToForm: () => void;
}

const PricingSection = React.forwardRef<HTMLDivElement, PricingSectionProps>(
  ({ onScrollToForm }, ref) => {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const el = sectionRef.current;
      if (!el) return;

      // Use IntersectionObserver so the animation fires reliably
      // regardless of smooth-scroll library timing.
      const pricingCards = el.querySelectorAll('.pricing-card');
      const addonCards = el.querySelectorAll('.addon-card');

      // Initially hide
      gsap.set(pricingCards, { y: 40, opacity: 0 });
      gsap.set(addonCards, { y: 30, opacity: 0 });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const target = entry.target;
            if (target.classList.contains('pricing-grid-wrap')) {
              gsap.to(pricingCards, {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.1,
                ease: 'power3.out',
              });
            }
            if (target.classList.contains('addons-grid')) {
              gsap.to(addonCards, {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power3.out',
              });
            }
            observer.unobserve(target);
          });
        },
        { threshold: 0.1 }
      );

      const pricingGrid = el.querySelector('.pricing-grid-wrap');
      const addonsGrid = el.querySelector('.addons-grid');
      if (pricingGrid) observer.observe(pricingGrid);
      if (addonsGrid) observer.observe(addonsGrid);

      return () => observer.disconnect();
    }, []);

    return (
      <section
        ref={(node) => {
          (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-black text-white border-t border-b border-white/10"
      >
        {/* Swiss Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
          }}
        />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <p className="font-mono text-xs tracking-widest uppercase text-cream-400 mb-3">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Simple, transparent pricing.
          </h2>
          <p className="text-gray-400 font-light mb-4 max-w-lg">
            Every project is scoped to what you actually need — no bloated packages, no surprises.
          </p>

          {/* Note bar */}
          <div className="inline-flex items-start gap-2 px-4 py-3 mb-12 border border-cream-500/20 bg-cream-500/5 text-cream-400 text-sm rounded">
            <FiInfo className="mt-0.5 shrink-0" size={14} />
            Prices shown are starting ranges. Final quotes after a free discovery call. 40% deposit required to begin.
          </div>

          {/* Pricing Grid */}
          <div className="pricing-grid-wrap grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`pricing-card relative flex flex-col p-6 border rounded-lg transition-all duration-300 hover:-translate-y-1 ${
                  tier.featured
                    ? 'border-cream-500/50 bg-white/[0.03] shadow-[0_0_0_1px_rgba(196,154,60,0.15),0_12px_40px_rgba(196,154,60,0.08)]'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-px right-5 bg-cream-500 text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-b">
                    Most Popular
                  </div>
                )}
                <div className={`font-mono text-xs tracking-widest mb-4 ${tier.featured ? 'text-cream-500' : 'text-gray-500'}`}>
                  {tier.number}
                </div>
                <div className="min-h-[100px]">
                  <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{tier.tagline}</p>
                </div>
                <div className="border-t border-b border-white/10 py-4 my-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-gray-500">from</span>
                    <span className="text-3xl font-extrabold tracking-tight">{tier.priceFrom}</span>
                    <span className="text-sm text-gray-500">{tier.priceTo}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                    <FiClock size={12} />
                    {tier.timeline}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 font-medium mb-3 tracking-wide">What's included</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <FiCheck
                        size={14}
                        className={`mt-0.5 shrink-0 ${tier.featured ? 'text-cream-500' : 'text-gray-500'}`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onScrollToForm}
                  className={`w-full py-3 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-[0.97] ${
                    tier.featured
                      ? 'bg-cream-500 text-black shadow-[0_4px_20px_rgba(196,154,60,0.28)] hover:bg-cream-400 hover:shadow-[0_4px_28px_rgba(196,154,60,0.42)]'
                      : 'border border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/[0.04] hover:text-white'
                  }`}
                  style={{ cursor: 'none' }}
                >
                  Get a quote &rarr;
                </button>
              </div>
            ))}
          </div>

          {/* Add-ons */}
          <div className="mt-20">
            <p className="font-mono text-xs tracking-widest uppercase text-cream-400 mb-2">
              Extras
            </p>
            <h3 className="text-2xl font-bold tracking-tight mb-1">Add-ons</h3>
            <p className="text-sm text-gray-500 mb-8">
              Bolt these onto any project to get exactly what you need.
            </p>
            <div className="addons-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {addOns.map((addon) => (
                <div
                  key={addon.name}
                  className="addon-card p-5 border border-white/10 bg-white/[0.02] rounded-lg hover:border-white/15 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <p className="text-sm font-semibold mb-1">{addon.name}</p>
                  <p className="text-xs text-gray-500 leading-relaxed flex-1">{addon.description}</p>
                  <p className="text-sm font-bold text-cream-400 mt-2">{addon.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
);

PricingSection.displayName = 'PricingSection';

export default PricingSection;
