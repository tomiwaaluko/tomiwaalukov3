import type { ProjectArchitecture } from './projectSchema';

/** Mermaid diagrams aligned with docs/projects/architecture/*.md (HLD, LLD, data flow). */
export const projectArchitectures: Record<string, ProjectArchitecture> = {
    'civic-lens': {
        hld: `flowchart TB
    FE["Next.js 16 frontend Vercel"]
    BE["FastAPI Docker"]
    DB[("PostgreSQL Supabase pgvector PostGIS")]
    SRC["FEC Congress OpenSecrets ingest"]

    FE -->|"REST NEXT_PUBLIC_API_URL"| BE
    BE --> DB
    SRC -->|"Batch ingest"| BE`,

        lld: `flowchart LR
    subgraph FastAPI
        D1["Routes politicians donations bills votes map"]
        QA["qa RAG router"]
        ING["ingest scripts"]
    end
    ORM["SQLAlchemy async"]
    GEM["Gemini embed plus generate"]

    D1 --> ORM
    QA --> ORM
    QA --> GEM
    ING --> ORM
    ORM --> PG[("Postgres")]`,

        dataFlow: `sequenceDiagram
    participant U as User
    participant N as Next.js
    participant F as FastAPI
    participant V as pgvector
    participant G as Gemini

    U->>N: Natural language question
    N->>F: POST qa with query
    F->>G: Embed query
    G-->>F: Vector
    F->>V: Nearest neighbor search
    V-->>F: Retrieved chunks plus citations
    F->>G: Generate answer with context
    G-->>F: Grounded response
    F-->>N: JSON answer plus sources
    N-->>U: UI with citations`,
    },

    'apply-sense': {
        hld: `flowchart TB
    APP["Next.js 15 App Router"]
    TRPC["tRPC plus TanStack Query"]
    AUTH["NextAuth Google"]
    OAI["OpenAI GPT-4o Vision"]
    DB[("PostgreSQL Supabase")]
    STOR["Supabase Storage"]

    APP --> TRPC
    TRPC --> AUTH
    TRPC --> DB
    TRPC --> OAI
    APP --> STOR`,

        lld: `flowchart LR
    subgraph Server
        JR["jobs router CRUD"]
        UR["upload router extract"]
        AR["auth context"]
    end
    OCR["ocr.ts GPT vision then Tesseract"]
    PR["Prisma client"]

    UR --> OCR
    JR --> PR
    AR --> PR`,

        dataFlow: `sequenceDiagram
    participant U as User
    participant B as Browser Tesseract
    participant T as tRPC
    participant O as OpenAI
    participant P as Prisma

    U->>B: Optional client OCR fallback
    U->>T: extractFromScreenshot imageUrl
    T->>O: GPT-4o Vision structured extract
    alt success
        O-->>T: Job fields JSON
    else fallback
        T->>T: Tesseract server path
    end
    T->>P: Insert JobApplication user scoped
    P-->>T: Row saved
    T-->>U: Prefill dashboard`,
    },

    'nsbe-app': {
        hld: `flowchart TB
    NX["Next.js 16 Vercel"]
    API["NestJS 11 Railway"]
    DB[("PostgreSQL Supabase")]
    AUTH["Supabase Auth JWT"]
    ST["Supabase Storage"]

    NX -->|"Bearer JWT X-API-Key"| API
    API --> DB
    AUTH -.->|"JWT verify"| API
    API --> ST`,

        lld: `flowchart LR
    subgraph NestModules
        M1["Auth Members Events"]
        M2["Attendance Stats Friends"]
        M3["EventInterest Storage Cache"]
    end
    PR["PrismaService"]
    M1 --> PR
    M2 --> PR
    M3 --> PR`,

        dataFlow: `sequenceDiagram
    participant M as Member
    participant W as Next.js
    participant N as NestJS
    participant P as Prisma

    M->>W: Scan QR at event
    W->>N: POST attendance checkin token
    N->>N: JwtAuthGuard validate
    N->>P: Transaction insert Attendance
    P-->>N: OK
    N->>N: Invalidate leaderboard cache
    N-->>W: Success plus stats
    W-->>M: Confetti UI`,
    },

    tenderpilot: {
        hld: `flowchart TB
    UI["Next.js 16 dashboard"]
    ORC["Orchestrator API routes"]
    AG1["Classifier Evidence Comms agents"]
    DB[("Supabase Postgres")]

    UI --> ORC
    ORC --> AG1
    AG1 --> DB
    UI -->|"Approvals HITL"| DB`,

        lld: `flowchart LR
    subgraph APIs
        A1["/api/orchestrator/run"]
        A2["/api/classify"]
        A3["/api/agents/evidence-sorter"]
        A4["/api/agents/client-comms"]
        A5["/api/loop/tick"]
    end
    GEM["Gemini 2.5 Pro"]

    A1 --> GEM
    A2 --> GEM
    A3 --> GEM
    A4 --> GEM`,

        dataFlow: `sequenceDiagram
    participant A as Attorney
    participant U as Next.js UI
    participant O as Orchestrator
    participant E as Evidence agent
    participant C as Classifier
    participant D as Database

    A->>U: Upload client message
    U->>O: POST orchestrator run
    par parallel
        O->>C: Classify route
        O->>E: Extract documents
    end
    C-->>O: Specialist route
    E-->>O: Structured evidence
    O->>D: Write tasks audit log
    O-->>U: Pending approval
    U-->>A: Review queue`,
    },

    digiconvo: {
        hld: `flowchart TB
    APP["Next.js 15"]
    ZU["Zustand chat plus emotion"]
    TR["tRPC routers"]
    GEM["Google Gemini"]
    DB[("Postgres optional Prisma")]

    APP --> ZU
    APP --> TR
    TR --> GEM
    TR --> DB`,

        lld: `flowchart LR
    subgraph Routers
        R1["gemini persona reply"]
        R2["tone analysis"]
        R3["upload screenshot analyze"]
    end
    subgraph Browser
        STT["Web Speech STT"]
        TTS["Web Speech TTS"]
    end
    PAGES["chat upload pages"] --> R1
    R1 --> GEM[Gemini SDK]
    R2 --> GEM
    R3 --> GEM`,

        dataFlow: `sequenceDiagram
    participant U as User
    participant C as Chat UI
    participant T as tRPC
    participant G as Gemini
    participant Z as Zustand

    U->>C: Send message
    C->>Z: Append user turn
    C->>T: getAiScenarioReply
    T->>G: Persona system prompt plus history
    G-->>T: Markdown reply
    T-->>C: Stream or full text
    par emotion
        C->>T: toneAnalysis
        T->>G: Analyze user text
        G-->>T: Emotion labels
        T-->>C: Emotion panel update
    end`,
    },

    'the-paint': {
        hld: `flowchart TB
    ING["Ingestion nba_api Odds cron"]
    FEAT["Feature pipelines sklearn"]
    ML["XGBoost LightGBM MAPIE"]
    API["FastAPI Railway"]
    RD[("Redis cache")]
    DB[("Postgres TimescaleDB")]
    UI["React Vite dashboard"]

    ING --> FEAT --> ML
    API --> ML
    API --> RD
    API --> DB
    UI -->|"REST"| API`,

        lld: `flowchart LR
    subgraph FastAPIRoutes
        P["/players /predict"]
        T["/teams"]
        F["/fantasy optimize"]
    end
    subgraph Services
        CACHE["Redis TTL 15m"]
        MODELS["Loaded registries"]
    end
    P --> CACHE
    P --> MODELS`,

        dataFlow: `sequenceDiagram
    participant U as User
    participant R as React
    participant F as FastAPI
    participant C as Redis
    participant M as Model bundle

    U->>R: Request player statline
    R->>F: GET predict
    F->>C: Cache key lookup
    alt miss
        F->>M: XGBoost inference plus intervals
        M-->>F: Point plus quantiles
        F->>C: SETEX
    else hit
        C-->>F: Cached JSON
    end
    F-->>R: Prediction payload
    R-->>U: Recharts view`,
    },

    pullup: {
        hld: `flowchart TB
    EX["Expo React Native"]
    RQ["TanStack Query"]
    SB["Supabase Auth PostgREST Storage"]
    PG[("PostgreSQL")]

    EX --> RQ
    RQ --> SB
    SB --> PG`,

        lld: `flowchart LR
    subgraph ExpoRouter
        A["auth signin"]
        B["tabs home rsvps profile"]
        C["org dashboard create"]
        D["events id detail"]
    end
    SB["supabase-js client"]
    A --> SB
    B --> SB
    C --> SB
    D --> SB`,

        dataFlow: `sequenceDiagram
    participant S as Student
    participant A as Expo app
    participant Q as React Query
    participant P as PostgREST

    S->>A: RSVP tap
    A->>Q: mutate insert rsvp
    Q->>P: Supabase from rsvps
    P-->>Q: Row written
    Q-->>A: Invalidate events feed
    A-->>S: Updated RSVP state`,
    },

    stacks: {
        hld: `flowchart TB
    NX["Next.js 14 App"]
    API["API routes Plaid AI wallet"]
    SB["Supabase Auth RLS Realtime"]
    PG[("PostgreSQL")]
    PL["Plaid"]
    AI["Google Generative AI"]
    CH["Polygon STX rewards"]

    NX --> API
    API --> SB
    SB --> PG
    API --> PL
    API --> AI
    API --> CH`,

        lld: `flowchart LR
    subgraph Routes
        R1["/api/plaid link"]
        R2["/api/ai coach"]
        R3["budget goals transactions"]
    end
    SB["Supabase server client"]
    R1 --> SB
    R2 --> SB
    R3 --> SB`,

        dataFlow: `sequenceDiagram
    participant U as User
    participant N as Next.js
    participant P as Plaid
    participant S as Supabase
    participant G as Google AI

    U->>N: Link bank
    N->>P: Create link token
    P-->>N: Public token exchange
    N->>S: Store accounts encrypted ref
    U->>N: Ask coach question
    N->>G: Prompt with spend summary
    G-->>N: Coaching text
    N-->>U: Dashboard update`,
    },

    'ucf-alphas-website': {
        hld: `flowchart TB
    SPA["Vite React SPA Vercel"]
    RQ["TanStack Query"]
    SB["Supabase Postgres RLS Storage"]
    RS["Resend email API"]

    SPA --> RQ
    RQ --> SB
    SPA -->|"POST contact"| RS`,

        lld: `flowchart LR
    subgraph Pages
        P1["Home leadership brothers"]
        P2["Lineage service contact"]
        P3["Admin CMS routes"]
    end
    Q["useQuery mutations"]
    P1 --> Q
    P2 --> Q
    P3 --> Q
    Q --> SB[Supabase client]`,

        dataFlow: `sequenceDiagram
    participant V as Visitor
    participant R as React
    participant SB as Supabase
    participant RS as Resend

    V->>R: Submit contact form
    R->>RS: Serverless api contact
    RS-->>R: 200 sent
    R-->>V: Thank you
    V->>R: Load service gallery
    R->>SB: Select service_events RLS read
    SB-->>R: Rows plus image paths`,
    },

    airfryhub: {
        hld: `flowchart TB
    RE["React 19 Vite SPA"]
    TQ["TanStack Query"]
    SB["Supabase Auth anon Realtime Storage"]
    PG[("PostgreSQL posts comments")]

    RE --> TQ
    TQ --> SB
    SB --> PG`,

        lld: `flowchart LR
    subgraph Pages
        F["Feed sort search"]
        P["Post detail upvote RPC"]
        C["CreatePost ImageUpload"]
    end
    HOOK["useOwner anonymous session"]
    F --> HOOK
    P --> SB[supabase-js]
    C --> SB`,

        dataFlow: `sequenceDiagram
    participant U as User
    participant A as React
    participant S as Supabase

    U->>A: Toggle upvote
    A->>S: rpc increment_upvotes post id
    S-->>A: New count
    A->>A: Query invalidate feed
    U->>A: New comment
    A->>S: Insert comments row RLS
    S-->>A: Realtime broadcast
    A-->>U: Thread updates`,
    },

    'poosd-small-project': {
        hld: `flowchart TB
    SPA["React 19 Vite SPA"]
    PHP["PHP REST LAMP"]
    MY[("MySQL users contacts")]

    SPA -->|"fetch JSON"| PHP
    PHP --> MY`,

        lld: `flowchart LR
    subgraph ReactRoutes
        L["Login"]
        S["Signup"]
        C["Contacts CRUD search"]
    end
    subgraph PHPScripts
        P1["Login Register"]
        P2["Add Edit Delete Search"]
    end
    C --> P2`,

        dataFlow: `sequenceDiagram
    participant U as User
    participant R as React
    participant P as PHP
    participant M as MySQL

    U->>R: Add contact form
    R->>P: POST AddContact.php JSON
    P->>M: INSERT contacts user scoped
    M-->>P: OK
    P-->>R: Success payload
    R-->>U: List refresh`,
    },

    'bbit-market-watch': {
        hld: `flowchart TB
    DEV["Docker Compose dev"]
    PROD["Producer publish.py"]
    RMQ[("RabbitMQ exchange queue")]
    CONS["Consumer consume.py"]
    NB["Jupyter bqplot labs"]

    DEV --> RMQ
    PROD -->|"AMQP 5672"| RMQ
    RMQ --> CONS
    NB --> PROD`,

        lld: `flowchart LR
    subgraph ProducerOOP
        PI["mqProducerInterface"]
        PC["mqProducer class"]
    end
    subgraph ConsumerOOP
        CI["mqConsumerInterface"]
        CC["mqConsumer class"]
    end
    PC -->|"publishOrder"| RMQ[(RabbitMQ)]
    RMQ --> CC`,

        dataFlow: `sequenceDiagram
    participant Pr as Producer
    participant B as Broker
    participant Co as Consumer

    Pr->>B: Declare exchange routing key
    Pr->>B: Basic publish message
    B->>Co: Deliver to queue
    Co->>Co: on_message_callback process
    Co->>B: Basic ack
    Note over Pr,Co: Management UI port 15672`,
    },

    'linkedin-scraper': {
        hld: `flowchart TB
    SW["MV3 service worker background"]
    CS["content.js Discord GroupMe"]
    PM["platform detectors scrapers"]
    POP["popup UI"]
    ST["chrome.storage.local"]

    SW <-->|messages| CS
    CS --> PM
    SW --> ST
    POP --> ST`,

        lld: `flowchart LR
    CMD["chrome.commands shortcut"]
    BG["background orchestrator"]
    DET["detectors hostname"]
    SCR["scrapers DOM regex LinkedIn URLs"]
    LN["linkedin-connect.js optional"]

    CMD --> BG
    BG --> CS[content script]
    CS --> DET
    DET --> SCR`,

        dataFlow: `sequenceDiagram
    participant U as User
    participant B as Background
    participant C as Content
    participant S as Storage

    U->>B: Command scrape
    B->>C: sendMessage scrape
    C->>C: Regex in chat DOM scroll lazy load
    C-->>B: URL list
    B->>S: chrome.storage.local set
    B-->>U: Popup reads list copy all`,
    },

    'tomiwa-eportfolio': {
        hld: `flowchart TB
    NX["Next.js 15 SPA sections"]
    FM["Framer Motion"]
    API["api send route"]
    RS["Resend"]
    VA["Vercel Analytics"]

    NX --> FM
    NX --> API
    API --> RS
    NX --> VA`,

        lld: `flowchart LR
    subgraph Components
        H["Hero type animation"]
        AB["About Projects Achievements"]
        E["EmailSection form"]
    end
    E --> R["route.js Zod validate"]
    R --> RS[Resend API]`,

        dataFlow: `sequenceDiagram
    participant V as Visitor
    participant P as Next.js page
    participant A as API send
    participant R as Resend

    V->>P: Fill contact form
    P->>A: POST JSON
    A->>R: Emails admin plus confirmation
    R-->>A: 200
    A-->>P: Success
    P-->>V: Toast`,
    },

    'portfolio-v3': {
        hld: `flowchart TB
    VT["Vite React 18 TS"]
    RR["React Router pages"]
    GSAP["GSAP ScrollTrigger"]
    API["Optional Express API"]
    PG[("Postgres Neon guestbook")]

    VT --> RR
    VT --> GSAP
    VT --> API
    API --> PG`,

        lld: `flowchart LR
    subgraph Pages
        H["Home sections"]
        PR["Projects detail Mermaid"]
        GB["Guestbook when enabled"]
    end
    subgraph State
        TC["ThemeContext"]
        MC["MusicContext"]
    end
    H --> TC`,

        dataFlow: `sequenceDiagram
    participant U as User
    participant R as React Router
    participant P as ProjectDetail
    participant D as projects data

    U->>R: Navigate projects civic-lens
    R->>P: Mount useParams
    P->>D: find by id
    D-->>P: Project plus architecture
    P->>P: Mermaid render tabs
    P-->>U: Blueprint view`,
    },
};
