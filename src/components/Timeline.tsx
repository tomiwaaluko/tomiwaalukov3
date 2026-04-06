import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiArrowUpRight } from 'react-icons/fi';
import ScrollRevealText from './ScrollRevealText';

gsap.registerPlugin(ScrollTrigger);

type Milestone = {
    year: string;
    title: string;
    description: string;
    tags: string[];
    /** When true, only the substring before the first " · " is styled red (company name). */
    redCompany?: boolean;
};

function MilestoneTitle({ title, redCompany }: { title: string; redCompany?: boolean }) {
    if (!redCompany) return <>{title}</>;
    const sep = ' · ';
    const i = title.indexOf(sep);
    if (i === -1) return <>{title}</>;
    return (
        <>
            <span className="text-red-500">{title.slice(0, i)}</span>
            <span className="text-inherit">{sep}{title.slice(i + sep.length)}</span>
        </>
    );
}

const milestones: Milestone[] = [
    {
        year: '2026',
        title: 'Bank of New York · Software Engineering Intern (Incoming)',
        redCompany: true,
        description:
            'Summer 2026. Selected for a competitive Software Engineering internship at a global financial technology and investment services company.',
        tags: ['Software Engineering', 'FinTech', 'Internship'],
    },
    {
        year: '2026',
        title: 'Bloomberg · Tech Lab Fellow',
        redCompany: true,
        description:
            'On-campus Bloomberg Tech Lab introducing RabbitMQ and the producer–consumer model for securities-style updates. Implemented Python mqProducer and mqConsumer classes (queues, exchanges, bindings, UTF-8 publish/consume). Ran RabbitMQ and services with Docker Compose and verified flows in the RabbitMQ Management UI.',
        tags: ['Python', 'RabbitMQ', 'Docker', 'Messaging'],
    },
    {
        year: '2025',
        title: 'Handshake · AI Research & Evaluation Auditor',
        redCompany: true,
        description:
            'Contract · Remote. Conduct quality assurance and review work supporting large-scale AI systems; collaborate cross-functionally for consistency, accuracy, and quality standards across multimodal datasets. Parallel role since Oct 2025: AI Model Quality & Data Annotation Researcher—data review and annotation work to improve reliability and performance across diverse modalities.',
        tags: ['AI Quality Assurance', 'Multimodal Review', 'Model Evaluation', 'Remote'],
    },
    {
        year: '2025',
        title: 'NSBE UCF · Software Engineer',
        description:
            'Architected a full-stack event management system for 100+ users with role-based access, OAuth, and REST APIs for attendance and 50+ annual events. Cut manual attendance processing time by roughly 75% using real-time check-in, validation, and analytics dashboards with Prisma and PostgreSQL. Deployed on Railway and Vercel with Docker, CI/CD, and resilient handling for peak database load.',
        tags: ['Next.js', 'TypeScript', 'NestJS', 'Prisma', 'PostgreSQL', 'Docker'],
    },
    {
        year: '2025',
        title: 'CodePath · Intermediate Technical Interview Prep (TIP102)',
        description:
            'Issued Aug 2025. Intensive interview preparation covering data structures, algorithms, and technical communication. Credential ID 67716.',
        tags: ['CodePath', 'Algorithms', 'Interview Prep', 'DSA'],
    },
    {
        year: '2025',
        title: 'CodePath · Intermediate Web Development Course (WEB102)',
        description:
            'Issued Aug 2025. Full-stack web development fundamentals and project-based coursework. Credential ID 336457.',
        tags: ['CodePath', 'Web Development', 'JavaScript', 'React'],
    },
    {
        year: '2024',
        title: 'NSBE UCF · Senator',
        description:
            'Facilitated chapter participation in regional and national conventions: voting and conference logistics, procedural guidance, budgeting oversight, and member communications.',
        tags: ['Organization', 'Event Management', 'Leadership'],
    },
    {
        year: '2024',
        title: 'Alpha Phi Alpha · Assistant East Area Director',
        description:
            'Coordinated communications and district operations for college chapters in the East Area of the Florida district, aligning chapters and supporting collaboration.',
        tags: ['Communication', 'Organization', 'Student Orgs'],
    },
    {
        year: '2024',
        title: 'Outlier · AI Data Quality Specialist',
        description:
            'Contract remote work on AI evaluation and data quality: guideline-driven generalist and skill-informed tasks, using programming, math, and language skills to assess outputs and support reliability of general-purpose AI systems.',
        tags: ['AI Evaluation', 'Data Quality', 'Python', 'React'],
    },
    {
        year: '2023',
        title: 'UCF · Office Assistant',
        description: 'Part-time on-campus role supporting departmental operations (Apr 2023 – Nov 2024).',
        tags: ['Operations', 'Customer Service', 'UCF'],
    },
    {
        year: '2023',
        title: 'Alpha Phi Alpha · Xi Iota Chapter · President',
        description:
            'Chief administrative officer: presided over meetings, chapter representation, and duties required by the office.',
        tags: ['Team Leadership', 'Governance', 'Organization'],
    },
    {
        year: '2022',
        title: 'Alpha Phi Alpha · Xi Iota Chapter · Secretary',
        description: 'Chapter secretary (Apr 2022 – Apr 2023): records, correspondence, and administrative support for Xi Iota.',
        tags: ['Administration', 'Organization', 'Written Communication'],
    },
    {
        year: '2022',
        title: 'NSBE UCF · AEx Committee Member',
        description: 'Academic Excellence committee service for the UCF chapter (Aug 2022 – May 2023).',
        tags: ['NSBE', 'Academic Programs', 'Teamwork'],
    },
];

const Timeline: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const items = gsap.utils.toArray('.timeline-item');

            items.forEach((item: any) => {
                const content = item.querySelector('.timeline-content');
                const title = item.querySelector('.timeline-title');
                const year = item.querySelector('.timeline-year-text');
                const line = item.querySelector('.timeline-progress-line');

                // Initial State
                gsap.set(content, { height: 0, autoAlpha: 0 });
                if (title) gsap.set(title, { opacity: 1, x: 0 });
                gsap.set(year, { opacity: 1, color: 'inherit' });
                gsap.set(line, { height: '0%', opacity: 0 });

                // Hover Logic
                item.addEventListener('mouseenter', () => expandItem(item));
                item.addEventListener('mouseleave', () => collapseItem(item));
            });

            function expandItem(item: HTMLElement) {
                const content = item.querySelector('.timeline-content');
                const arrow = item.querySelector('.timeline-arrow');
                const title = item.querySelector('.timeline-title');
                const year = item.querySelector('.timeline-year-text');
                const line = item.querySelector('.timeline-progress-line');

                gsap.to(content, { height: "auto", autoAlpha: 1, duration: 0.4, ease: "power3.out" }); // Faster
                gsap.to(arrow, { rotation: 45, opacity: 1, duration: 0.3 });

                // Hollow Title Effect
                if (title) {
                    title.classList.add('text-stroke-responsive');
                    gsap.to(title, {
                        color: 'transparent',
                        opacity: 0.75,
                        x: 10,
                        scale: 1.05,
                        originLeft: 0,
                        duration: 0.3
                    });
                }

                gsap.to(year, { opacity: 0.8, scale: 1.5, color: "#ef4444", duration: 0.3 });
                gsap.to(line, { height: "100%", opacity: 1, duration: 0.4, ease: "power2.out" });

                gsap.to(item, {
                    backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    duration: 0.3
                });
            }

            function collapseItem(item: HTMLElement) {
                const content = item.querySelector('.timeline-content');
                const arrow = item.querySelector('.timeline-arrow');
                const title = item.querySelector('.timeline-title');
                const year = item.querySelector('.timeline-year-text');
                const line = item.querySelector('.timeline-progress-line');

                gsap.to(content, { height: 0, autoAlpha: 0, duration: 0.3, ease: "power3.in" });
                gsap.to(arrow, { rotation: 0, opacity: 0.3, duration: 0.3 });

                // Revert Title
                if (title) {
                    title.classList.remove('text-stroke-responsive');
                    gsap.to(title, {
                        color: 'inherit',
                        opacity: 0.8,
                        x: 0,
                        scale: 1,
                        duration: 0.3
                    });
                }

                gsap.to(year, { opacity: 0.8, scale: 1, color: "inherit", duration: 0.3 });
                gsap.to(line, { height: "0%", opacity: 0, duration: 0.3 });

                gsap.to(item, { backgroundColor: 'transparent', duration: 0.3 });
            }

        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} id="timeline" className="bg-white dark:bg-black font-sans text-black dark:text-white py-24 md:py-32">
            {/* Header: Skills Style (Right Aligned) */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 mb-0 border-b border-black dark:border-white/40 pb-12">
                <div className="flex flex-col items-end">
                    <h2 className="text-[18vw] md:text-[8vw] leading-[0.8] font-bold uppercase tracking-tighter text-transparent text-stroke-responsive opacity-60 select-none pointer-events-none">
                        <ScrollRevealText text="DIGITAL" />
                    </h2>
                    <div className="flex flex-col md:flex-row w-full justify-between items-end md:items-end gap-6">
                        {/* Description (Left Side now) */}
                        <p className="font-mono text-sm max-w-sm text-neutral-500 dark:text-neutral-400 text-left order-2 md:order-1 self-start md:self-end pb-2">
                             // SYSTEM_LOGS_V3.0<br />
                            COMMITS_&_MILESTONES
                        </p>

                        <span className="text-[15vw] md:text-[8vw] leading-[0.8] font-bold uppercase tracking-tighter text-black dark:text-white order-1 md:order-2">
                            <ScrollRevealText text="EVOLUTION_" />
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                {milestones.map((item, index) => (
                    <div key={index} className="timeline-item border-b border-black/10 dark:border-white/10 group cursor-default transition-colors overflow-hidden relative">
                        <div className="py-4 md:py-8 px-4 md:px-12 flex flex-col md:flex-row items-start md:items-baseline gap-2 md:gap-8 relative z-10 w-full">

                            {/* Year Column / Eyebrow Label */}
                            {/* Mobile: Small Red Label above Title | Desktop: Static Left Column */}
                            <div className="w-full md:w-20 shrink-0 pt-1 relative md:h-full md:min-h-[2rem]">
                                <span className="timeline-year-text font-mono font-bold
                                    text-sm text-red-500 mb-1 block
                                    md:text-sm md:font-normal md:tracking-widest md:text-inherit md:text-stroke-0 md:opacity-60 md:mb-0
                                    transition-colors duration-300 origin-left">
                                    {item.year}
                                </span>
                                {/* Vertical Progress Line - Desktop Only */}
                                <div className="timeline-progress-line absolute left-0 top-0 w-[2px] bg-red-500 h-0 opacity-0 md:-left-6 hidden md:block"></div>
                            </div>

                            {/* Content Column */}
                            <div className="flex-grow w-full z-10 relative">
                                <div className="flex items-center justify-between w-full">
                                    <h3 className="timeline-title text-xl md:text-4xl font-bold uppercase tracking-tight leading-[0.9] md:leading-tight transition-all duration-300 origin-left mb-2 md:mb-0">
                                        <MilestoneTitle title={item.title} redCompany={item.redCompany} />
                                    </h3>
                                    <FiArrowUpRight className="timeline-arrow w-5 h-5 shrink-0 transition-transform duration-300 opacity-30" />
                                </div>

                                {/* Expandable Content Area */}
                                <div className="timeline-content h-0 overflow-hidden opacity-0 will-change-[height,opacity]">
                                    <div className="pt-2 md:pt-6 max-w-2xl">
                                        <p className="font-sans text-sm md:text-lg opacity-100 leading-relaxed mb-4 font-light">
                                            {item.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pb-2">
                                            {item.tags.map(t => (
                                                <span key={t} className="text-[10px] md:text-xs font-mono uppercase tracking-wider border border-black/20 dark:border-white/20 px-2 py-0.5 md:px-3 md:py-1 rounded-full opacity-60">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Timeline;
