%-------------------------
% Resume in Latex
% Author : Olatomiwa Aluko
%------------------------

\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{} % clear all header and footer fields
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.75in}
\addtolength{\evensidemargin}{-0.75in}
\addtolength{\textwidth}{1.5in}
\addtolength{\topmargin}{-0.75in}
\addtolength{\textheight}{1.5in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% Sections formatting
\titleformat{\section}{\bfseries\scshape\raggedright\large}{}{0em}{}[\color{black}\titlerule]

\pdfgentounicode=1

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{\item\small{#1\vspace{-2pt}}}

% Education / 2-line subheading
\newcommand{\resumeSubheading}[4]{%
\vspace{-2pt}\item
{\small
\begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
\textbf{#1} & #2 \\
\textit{#3} & \textit{#4} \\
\end{tabular*}}
\vspace{-7pt}
}

% Single-line sub-subheading
\newcommand{\resumeSubSubheading}[2]{%
\item
{\small
\begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
\textit{#1} & \textit{#2} \\
\end{tabular*}}
\vspace{-7pt}
}

% Projects: bold titles, italicize tech stack, consistent small font
\newcommand{\resumeProjectHeading}[3][]{%
\item
{\small
\begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
\textbf{#2} & #3 \\
\multicolumn{2}{l}{\textit{#1}} \\
\end{tabular*}}
\vspace{-7pt}
}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}[label=\textbullet]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

% One-line role + company, dates right
\newcommand{\resumeOneLine}[2]{%
\vspace{-2pt}\item
{\small
\begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
\textbf{#1} & #2 \\
\end{tabular*}}
\vspace{-7pt}
}

%-------------------------------------------
%%%%%% RESUME STARTS HERE %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}

%----------HEADING----------
\begin{center}
\textbf{\Huge \scshape Olatomiwa Aluko} \\
\vspace{2pt}
\footnotesize
\href{tel:17866609146}{(786)-660-9146} $|$
\href{mailto:tomiwaaluko02@gmail.com}{tomiwaaluko02@gmail.com} $|$
\href{https://tomiwaaluko.com}{tomiwaaluko.com} $|$
\href{https://linkedin.com/in/olatomiwaaluko}{linkedin.com/in/olatomiwaaluko} $|$
\href{https://github.com/tomiwaaluko}{github.com/tomiwaaluko}
\end{center}

%-----------EDUCATION-----------
\section{Education}
\resumeSubHeadingListStart
\resumeSubheading
{University of Central Florida (UCF)}{Orlando, FL}
{Bachelor of Science in Computer Engineering, Minor in Technology Entrepreneurship}{Expected May 2027}
\resumeItemListStart
\vspace{2pt}
\resumeItem{GPA: 3.50/4.00}
\resumeItem{Organizations: Colorstack, National Society of Black Engineers, Knight Hacks, Alpha Phi Alpha Fraternity, Inc.}
\resumeItemListEnd
\resumeSubHeadingListEnd

%-----------SKILLS-----------
\section{Skills}
\begin{itemize}[leftmargin=0.15in, label={}]
\small{\item{
\textbf{Languages}{: Python, Java, C, HTML, CSS, JavaScript, TypeScript} \\
\textbf{Frameworks}{: ReactJS, Node.js, Next.js, NestJS, Tailwind CSS, tRPC, FastAPI} \\
\textbf{AI \& Automation}{: Microsoft Copilot Studio, Generative AI (Claude, ChatGPT, Gemini), RAG pipelines, prompt engineering, AI agent design, model evaluation, data annotation, MLflow} \\
\textbf{Developer Tools \& Technologies}{: Git/GitHub, Docker, Vercel, Postman, Prisma, Supabase, REST APIs, PostgreSQL, Redis, Apache Airflow, Microsoft 365}
}}
\end{itemize}

%-----------EXPERIENCE-----------
\section{Professional Experience}
\resumeSubHeadingListStart

\resumeProjectHeading[Software Engineering Intern (Incoming)]{\href{https://www.bnymellon.com/}{BNY}}{Summer 2026}
\resumeItemListStart
\resumeItem{Selected for a competitive Software Engineering internship at a global financial technology and investment services company managing \$50T+ in assets under custody.}
\resumeItemListEnd

\resumeProjectHeading[AI Research, Evaluation \& Data Annotation (Contract)]{\href{https://www.handshake.com/}{Handshake}}{Oct 2025 -- Present}
\resumeItemListStart
\resumeItem{Evaluated and annotated outputs from large-scale AI systems across diverse modalities, applying structured rubrics to assess model accuracy, reasoning, and instruction-following --- directly analogous to AI agent testing and output validation.}
\resumeItem{Collaborated cross-functionally to ensure output consistency and adherence to quality standards, contributing to measurable improvements in system reliability and performance.}
\resumeItemListEnd

\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\section{Projects}
\resumeSubHeadingListStart

\resumeProjectHeading[Microsoft Copilot Studio, Azure AI, Microsoft Teams, SharePoint, Outlook Integration]{NSBE Convention AI Agent | Microsoft Agent-a-thon \textbf{(1st Place)}}{}
\resumeItemListStart
\resumeItem{\textbf{Won 1st place} out of 100+ participants at a Microsoft-hosted Agent-a-thon at the 2026 NSBE Annual Convention, competing in a 60-minute sprint to design and build a production-ready AI agent in \textbf{Microsoft Copilot Studio}.}
\resumeItem{Configured a multi-feature convention assistant handling smart event discovery, personalized scheduling, and custom Outlook calendar delivery --- connecting knowledge sources, custom actions, and plugins end-to-end within Copilot Studio.}
\resumeItem{Integrated ATS-powered resume review with scoring and AI-driven interview prep modules, evaluated by Microsoft on creativity, functionality, and real-world impact; earned a \textbf{Microsoft Copilot Studio completion badge}.}
\resumeItemListEnd

\resumeProjectHeading[Next.js (React), TypeScript, FastAPI, PostgreSQL, Docker, Google Gemini AI, Git/Github, Mapbox GL, react-force-graph]{\href{https://github.com/tomiwaaluko/civiclens}{CivicLens | Political Data Transparency Platform (Hackathon)}}{}
\resumeItemListStart
\resumeItem{\textbf{Led a team of 4 engineers end-to-end}: captured requirements, defined success criteria, scoped deliverables, tracked risks, and delivered a production-ready platform within 24 hours --- mirroring an AI project lifecycle from intake to deployment.}
\resumeItem{Designed and deployed a \textbf{RAG-powered AI chatbot with 99.2\% citation accuracy} using Google Gemini 2.5 Flash and pgvector, implementing semantic search and a fact-checking pipeline to prevent hallucinations --- directly applicable to enterprise AI agent configuration and output validation.}
\resumeItem{Built a \textbf{three-tier caching strategy} reducing API calls by 85\% and response times from 3s to 300ms; aggregated FEC, Congress.gov, and OpenSecrets APIs into interactive 3D network graphs serving \textbf{535+ congressional representatives}.}
\resumeItemListEnd

\resumeProjectHeading[Next.js (React), TypeScript, NestJS, Prisma, PostgreSQL, OAuth, Railway, Vercel, Git/Github]{\href{https://github.com/tomiwaaluko/nsbe-ucf-eventtracker}{NSBE App | Organization Management Platform}}{}
\resumeItemListStart
\resumeItem{Architected and shipped a full-stack event management platform serving \textbf{100+ users} across 50+ annual events, owning the project from requirements gathering through deployment and continuous improvement.}
\resumeItem{Implemented role-based access control, real-time check-in, and analytics dashboards --- reducing manual attendance processing time by \textbf{75\%} and translating messy organizational workflows into automated, repeatable systems.}
\resumeItem{Maintained technical documentation and user-facing guides for non-technical stakeholders; deployed with CI/CD pipelines and Docker containerization achieving \textbf{99.9\% uptime}.}
\resumeItemListEnd

\resumeSubHeadingListEnd

\end{document}