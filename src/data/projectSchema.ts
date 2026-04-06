/** System design tabs on project detail (Mermaid). */
export interface ProjectArchitecture {
    hld: string;
    lld: string;
    dataFlow: string;
}

export interface Project {
    id: string;
    title: string;
    category: string;
    description: string;
    longDescription: string;
    tech: string[];
    year: string;
    status: string;
    image: string;
    /** When set, project detail hero shows this MP4 instead of `image` (list views still use `image`). */
    heroVideo?: string;
    /** Engineering index thumbnail: muted MP4 that plays while the row is hovered (`image` used as poster). */
    listHoverVideo?: string;
    github: string;
    /** When set, replaces the default View Source Code row (href overrides github for that link). */
    primaryCta?: { label: string; href: string };
    live: string | null;
    impact?: string[];
    challenges?: { title: string; description: string; solution: string }[];
    size?: 'small' | 'medium' | 'large';
    color: string;
    architecture?: ProjectArchitecture;
}
