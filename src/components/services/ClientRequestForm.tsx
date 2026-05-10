import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import {
  websiteTypes,
  pageOptions,
  featureOptions,
  designStyles,
  budgetRanges,
} from '../../data/servicesData';

const TOTAL_STEPS = 7;

const STEP_LABELS = [
  'Contact',
  'Project',
  'Pages & Features',
  'Design',
  'Content',
  'Timeline',
  'Review',
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  projectType: string;
  mainGoal: string;
  targetAudience: string;
  domainName: string;
  pagesNeeded: string[];
  features: string[];
  cmsNeeded: string;
  mobileFriendly: string;
  colorPreferences: string;
  designStyle: string;
  websitesYouLike: string;
  hasLogo: string;
  brandFonts: string;
  contentProvider: string;
  imageProvider: string;
  existingContent: string;
  launchDate: string;
  budget: string;
  maintenance: string;
  additionalNotes: string;
}

const initialForm: FormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  website: '',
  projectType: '',
  mainGoal: '',
  targetAudience: '',
  domainName: '',
  pagesNeeded: [],
  features: [],
  cmsNeeded: '',
  mobileFriendly: '',
  colorPreferences: '',
  designStyle: '',
  websitesYouLike: '',
  hasLogo: '',
  brandFonts: '',
  contentProvider: '',
  imageProvider: '',
  existingContent: '',
  launchDate: '',
  budget: '',
  maintenance: '',
  additionalNotes: '',
};

const ClientRequestForm = React.forwardRef<HTMLDivElement>((_props, ref) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const rawApiUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
  const API_URL = rawApiUrl.endsWith('/api')
    ? rawApiUrl.slice(0, -4) + '/api'
    : rawApiUrl;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.form-header', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const animateStep = (direction: 'left' | 'right') => {
    const el = stepRef.current;
    if (!el) return;
    const xFrom = direction === 'left' ? 60 : -60;
    gsap.fromTo(el, { x: xFrom, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
  };

  const next = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      animateStep('left');
    }
  };
  const prev = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      animateStep('right');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (field: 'pagesNeeded' | 'features', value: string) => {
    const arr = form[field];
    setForm({
      ...form,
      [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    });
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/collaborate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'services' }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; errors?: { msg?: string }[] };
      if (!res.ok) {
        const msg =
          data.errors?.map((x) => x.msg).filter(Boolean).join(' ') ||
          data.error ||
          'Something went wrong. Try again.';
        setSubmitError(msg);
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-transparent border-b border-white/30 dark:border-white/30 py-3 text-base font-light tracking-wide outline-none focus:border-cream-400 transition-colors placeholder:text-gray-500 placeholder:text-xs placeholder:uppercase placeholder:tracking-widest text-black dark:text-white';

  const selectClass =
    'w-full bg-transparent border-b border-white/30 dark:border-white/30 py-3 text-base font-light outline-none focus:border-cream-400 transition-colors text-black dark:text-white appearance-none';

  const radioClass = (selected: boolean) =>
    `px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all duration-200 ${
      selected
        ? 'border-cream-500 bg-cream-500/10 text-cream-400'
        : 'border-white/10 text-gray-500 hover:border-white/20'
    }`;

  const checkboxClass = (selected: boolean) =>
    `px-3 py-2 text-xs font-mono tracking-wide border transition-all duration-200 ${
      selected
        ? 'border-cream-500 bg-cream-500/10 text-cream-400'
        : 'border-white/10 text-gray-500 hover:border-white/20'
    }`;

  const canProceed = () => {
    if (step === 1) return form.name.trim() !== '' && form.email.trim() !== '';
    return true;
  };

  if (submitted) {
    return (
      <section
        ref={(node) => {
          (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-black text-white border-t border-white/10"
      >
        <div className="max-w-[600px] mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-cream-500/10 border border-cream-500/30 flex items-center justify-center mx-auto mb-6">
            <FiCheck size={28} className="text-cream-500" />
          </div>
          <h3 className="text-3xl font-bold tracking-tighter mb-3">Request Received</h3>
          <p className="text-gray-400 font-light">
            Thanks for reaching out! I'll review your project details and get back to you within 24-48 hours.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={(node) => {
        (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-black text-white border-t border-white/10"
    >
      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '4rem 4rem',
        }}
      />

      <div className="max-w-[800px] mx-auto relative z-10">
        <div className="form-header mb-12">
          <p className="font-mono text-xs tracking-widest uppercase text-cream-400 mb-3">
            Start a Project
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-3">
            Client Request Form
          </h2>
          <p className="text-gray-400 font-light">
            Tell me about your project. The more detail, the better the quote.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-10">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1 w-full rounded-full transition-colors duration-300 ${
                  i + 1 <= step ? 'bg-cream-500' : 'bg-white/10'
                }`}
              />
              <span
                className={`text-[10px] font-mono uppercase tracking-wider hidden md:block ${
                  i + 1 === step ? 'text-cream-400' : 'text-gray-600'
                }`}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div ref={stepRef} className="min-h-[320px]">
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input name="name" placeholder="FULL NAME *" value={form.name} onChange={handleChange} className={inputClass} required />
                <input name="email" type="email" placeholder="EMAIL *" value={form.email} onChange={handleChange} className={inputClass} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input name="phone" placeholder="PHONE" value={form.phone} onChange={handleChange} className={inputClass} />
                <input name="company" placeholder="COMPANY / ORGANIZATION" value={form.company} onChange={handleChange} className={inputClass} />
              </div>
              <input name="website" placeholder="EXISTING WEBSITE (IF ANY)" value={form.website} onChange={handleChange} className={inputClass} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block font-mono">Website Type</label>
                <select name="projectType" value={form.projectType} onChange={handleChange} className={selectClass}>
                  <option value="">Select...</option>
                  {websiteTypes.map((t) => (
                    <option key={t} value={t} className="bg-black">{t}</option>
                  ))}
                </select>
              </div>
              <input name="mainGoal" placeholder="MAIN GOAL OF THE WEBSITE" value={form.mainGoal} onChange={handleChange} className={inputClass} />
              <input name="targetAudience" placeholder="TARGET AUDIENCE" value={form.targetAudience} onChange={handleChange} className={inputClass} />
              <input name="domainName" placeholder="DESIRED DOMAIN NAME" value={form.domainName} onChange={handleChange} className={inputClass} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block font-mono">Pages Needed</label>
                <div className="flex flex-wrap gap-2">
                  {pageOptions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleCheckbox('pagesNeeded', p)}
                      className={checkboxClass(form.pagesNeeded.includes(p))}
                      style={{ cursor: 'none' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block font-mono">Features</label>
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleCheckbox('features', f)}
                      className={checkboxClass(form.features.includes(f))}
                      style={{ cursor: 'none' }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block font-mono">Need a CMS?</label>
                  <div className="flex gap-2">
                    {['Yes', 'No', 'Not sure'].map((v) => (
                      <button key={v} type="button" onClick={() => setForm({ ...form, cmsNeeded: v })} className={radioClass(form.cmsNeeded === v)} style={{ cursor: 'none' }}>{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block font-mono">Mobile-friendly?</label>
                  <div className="flex gap-2">
                    {['Yes', 'Desktop only'].map((v) => (
                      <button key={v} type="button" onClick={() => setForm({ ...form, mobileFriendly: v })} className={radioClass(form.mobileFriendly === v)} style={{ cursor: 'none' }}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <input name="colorPreferences" placeholder="COLOR PREFERENCES (E.G. BLUE, EARTH TONES)" value={form.colorPreferences} onChange={handleChange} className={inputClass} />
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block font-mono">Design Style / Vibe</label>
                <select name="designStyle" value={form.designStyle} onChange={handleChange} className={selectClass}>
                  <option value="">Select...</option>
                  {designStyles.map((s) => (
                    <option key={s} value={s} className="bg-black">{s}</option>
                  ))}
                </select>
              </div>
              <input name="websitesYouLike" placeholder="WEBSITES YOU LIKE (URLS)" value={form.websitesYouLike} onChange={handleChange} className={inputClass} />
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block font-mono">Do you have a logo?</label>
                <div className="flex gap-2">
                  {['Yes', 'No', 'Need one'].map((v) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, hasLogo: v })} className={radioClass(form.hasLogo === v)} style={{ cursor: 'none' }}>{v}</button>
                  ))}
                </div>
              </div>
              <input name="brandFonts" placeholder="PREFERRED FONTS (IF ANY)" value={form.brandFonts} onChange={handleChange} className={inputClass} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block font-mono">Who provides the copy?</label>
                <div className="flex flex-wrap gap-2">
                  {['I will provide it', 'I need help writing it', 'Not sure yet'].map((v) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, contentProvider: v })} className={radioClass(form.contentProvider === v)} style={{ cursor: 'none' }}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block font-mono">Who provides images?</label>
                <div className="flex flex-wrap gap-2">
                  {['I have my own', 'Use stock photos', 'Need photography', 'Not sure'].map((v) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, imageProvider: v })} className={radioClass(form.imageProvider === v)} style={{ cursor: 'none' }}>{v}</button>
                  ))}
                </div>
              </div>
              <textarea
                name="existingContent"
                placeholder="EXISTING CONTENT OR MATERIALS YOU HAVE"
                value={form.existingContent}
                onChange={handleChange}
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <input name="launchDate" placeholder="DESIRED LAUNCH DATE" value={form.launchDate} onChange={handleChange} className={inputClass} />
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block font-mono">Budget Range</label>
                <select name="budget" value={form.budget} onChange={handleChange} className={selectClass}>
                  <option value="">Select...</option>
                  {budgetRanges.map((b) => (
                    <option key={b} value={b} className="bg-black">{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block font-mono">Need ongoing maintenance?</label>
                <div className="flex gap-2">
                  {['Yes', 'No', 'Maybe later'].map((v) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, maintenance: v })} className={radioClass(form.maintenance === v)} style={{ cursor: 'none' }}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <textarea
                name="additionalNotes"
                placeholder="ANYTHING ELSE I SHOULD KNOW?"
                value={form.additionalNotes}
                onChange={handleChange}
                rows={5}
                className={`${inputClass} resize-none`}
              />
              {/* Summary */}
              <div className="border border-white/10 rounded-lg p-6 space-y-3 text-sm">
                <p className="font-mono text-xs uppercase tracking-widest text-cream-400 mb-4">Review Summary</p>
                {form.name && <p><span className="text-gray-500">Name:</span> {form.name}</p>}
                {form.email && <p><span className="text-gray-500">Email:</span> {form.email}</p>}
                {form.company && <p><span className="text-gray-500">Company:</span> {form.company}</p>}
                {form.projectType && <p><span className="text-gray-500">Type:</span> {form.projectType}</p>}
                {form.mainGoal && <p><span className="text-gray-500">Goal:</span> {form.mainGoal}</p>}
                {form.pagesNeeded.length > 0 && <p><span className="text-gray-500">Pages:</span> {form.pagesNeeded.join(', ')}</p>}
                {form.features.length > 0 && <p><span className="text-gray-500">Features:</span> {form.features.join(', ')}</p>}
                {form.designStyle && <p><span className="text-gray-500">Style:</span> {form.designStyle}</p>}
                {form.budget && <p><span className="text-gray-500">Budget:</span> {form.budget}</p>}
                {form.launchDate && <p><span className="text-gray-500">Launch:</span> {form.launchDate}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
          {step > 1 ? (
            <button
              onClick={prev}
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              style={{ cursor: 'none' }}
            >
              <FiArrowLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {submitError && (
            <p className="text-sm text-red-400" role="alert">{submitError}</p>
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={next}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black text-xs font-bold tracking-widest uppercase hover:bg-cream-500 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ cursor: 'none' }}
            >
              Next <FiArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-cream-500 text-black text-xs font-bold tracking-widest uppercase hover:bg-cream-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ cursor: 'none' }}
            >
              {isSubmitting ? 'Sending...' : 'Submit Request'} <FiArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
});

ClientRequestForm.displayName = 'ClientRequestForm';

export default ClientRequestForm;
