import React, { useRef } from 'react';
import ServicesHero from '../components/services/ServicesHero';
import WorkShowcase from '../components/services/WorkShowcase';
import PricingSection from '../components/services/PricingSection';
import ClientRequestForm from '../components/services/ClientRequestForm';
import ServicesFAQ from '../components/services/ServicesFAQ';
import Footer from '../components/Footer';

const Services: React.FC = () => {
  const pricingRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Swiss Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="w-full h-full grid grid-cols-6 lg:grid-cols-12 gap-0">
          {[...Array(13)].map((_, i) => (
            <div key={i} className="h-full w-px bg-black/5 dark:bg-white/5 mx-auto" />
          ))}
        </div>
      </div>

      <ServicesHero
        onScrollToPricing={() => scrollTo(pricingRef)}
        onScrollToForm={() => scrollTo(formRef)}
      />
      <WorkShowcase />
      <PricingSection ref={pricingRef} onScrollToForm={() => scrollTo(formRef)} />
      <ServicesFAQ />
      <ClientRequestForm ref={formRef} />
      <Footer />
    </div>
  );
};

export default Services;
