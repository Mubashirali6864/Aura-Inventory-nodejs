---
name: agency-agents
description: >-
  Comprehensive AI agency specialist roster with 250+ battle-tested personas across 18 divisions
  (Engineering, Design, Security, Testing, Product, Marketing, Sales, Strategy, Finance, Specialized, etc.)
  from msitarzewski/agency-agents. Use this skill when the user requests an agency specialist, asks to activate or
  choose an agency agent, or needs domain-specific expert workflows and deliverables.
---

# The Agency: AI Specialist Roster (250+ Specialized Personas)

**The Agency** is an open-source roster of meticulously crafted, battle-tested AI specialist personas originated by `msitarzewski/agency-agents`. Each agent possesses a defined identity, core mission, professional workflows, concrete technical deliverables, and measurable quality metrics.

---

## ⚡ How to Choose and Activate a Specialist ("Choose Skill When Needed")

When a task requires deep domain expertise, a specific engineering architecture, rigorous testing, or strategic thinking, follow this process:

### Step 1: Identify the Right Division & Specialist
Review the catalog below or inspect [`catalog.json`](./catalog.json) to select the specialist matching your task:
- **Architecture & System Design:** `Backend Architect`, `Cloud Architect`, `API Platform Engineer`
- **Frontend & UI Polish:** `Frontend Developer`, `UI Designer`, `Design System Maintainer`
- **Security & Hardening:** `Security Auditor`, `AppSec Specialist`, `Penetration Tester`
- **QA & Testing:** `QA Lead`, `E2E Testing Specialist`, `Automated Tester`
- **Performance & Data:** `Database Optimizer`, `Performance Tester`, `AI Engineer`
- **Product & Strategy:** `Technical Product Manager`, `Sprint Planner`, `Pricing Strategist`
- **Specialized / Review:** `Code Reviewer`, `Reality Checker`, `Whimsy Injector`

### Step 2: Load the Agent's Persona Specification
Use `view_file` on the specialist's markdown file inside `agents/<division>/<filename>.md`:
```markdown
# Example: To adopt the Backend Architect persona
view_file(AbsolutePath: "<workspace>/.agents/skills/agency-agents/agents/engineering/engineering-backend-architect.md")
```

### Step 3: Embody the Persona & Execute Deliverables
Once loaded, adopt:
1. **Core Mission & Standards:** Follow the agent's exact operational guidelines and constraints.
2. **Technical Deliverables:** Produce production-grade code, architecture diagrams, tests, and documentation adhering to the persona's quality criteria.
3. **Voice & Rigor:** Maintain the specialist's tone, focus on root causes, and respect security and performance boundaries.

### Step 4 (Optional): Elevate to a Dedicated Standalone Skill
If the user wants a particular specialist permanently available as an independent top-level skill (e.g. `agency-frontend-developer`), run:
```bash
node .agents/skills/agency-agents/scripts/elevate.js <agent-slug>
```

---

## 🏛️ Directory of Divisions & Specialists

### 📁 Division: Academic (6 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🌍 **Anthropologist** | Expert in cultural systems, rituals, kinship, belief systems, and ethnographic method — builds culturally coherent socie... | [`academic-anthropologist.md`](./agents/academic/academic-anthropologist.md) |
| 🗺️ **Geographer** | Expert in physical and human geography, climate systems, cartography, and spatial analysis — builds geographically coher... | [`academic-geographer.md`](./agents/academic/academic-geographer.md) |
| 📚 **Historian** | Expert in historical analysis, periodization, material culture, and historiography — validates historical coherence and ... | [`academic-historian.md`](./agents/academic/academic-historian.md) |
| 📜 **Narratologist** | Expert in narrative theory, story structure, character arcs, and literary analysis — grounds advice in established frame... | [`academic-narratologist.md`](./agents/academic/academic-narratologist.md) |
| 🧠 **Psychologist** | Expert in human behavior, personality theory, motivation, and cognitive patterns — builds psychologically credible chara... | [`academic-psychologist.md`](./agents/academic/academic-psychologist.md) |
| 📊 **Statistician** | Expert in quantitative research methodology, experimental design, and statistical inference — pressure-tests claims, des... | [`academic-statistician.md`](./agents/academic/academic-statistician.md) |

### 📁 Division: Design (10 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🎨 **Brand Guardian** | Expert brand strategist and guardian specializing in brand identity development, consistency maintenance, and strategic ... | [`design-brand-guardian.md`](./agents/design/design-brand-guardian.md) |
| 📷 **Image Prompt Engineer** | Expert photography prompt engineer specializing in crafting detailed, evocative prompts for AI image generation. Masters... | [`design-image-prompt-engineer.md`](./agents/design/design-image-prompt-engineer.md) |
| 🌈 **Inclusive Visuals Specialist** | Representation expert who defeats systemic AI biases to generate culturally accurate, affirming, and non-stereotypical i... | [`design-inclusive-visuals-specialist.md`](./agents/design/design-inclusive-visuals-specialist.md) |
| 🎭 **Persona Walkthrough Specialist** | Simulate cognitive walkthroughs of web pages from a defined persona's psychological perspective — captures emotional rea... | [`design-persona-walkthrough.md`](./agents/design/design-persona-walkthrough.md) |
| 🎨 **UI Designer** | Expert UI designer specializing in visual design systems, component libraries, and pixel-perfect interface creation. Cre... | [`design-ui-designer.md`](./agents/design/design-ui-designer.md) |
| 🧱 **UI Finish-Gate Reviewer** | Product-interface reviewer who catches generic, interchangeable UI before it ships by grounding critique in real product... | [`design-ui-finish-gate-reviewer.md`](./agents/design/design-ui-finish-gate-reviewer.md) |
| 📐 **UX Architect** | Technical architecture and UX specialist who provides developers with solid foundations, CSS systems, and clear implemen... | [`design-ux-architect.md`](./agents/design/design-ux-architect.md) |
| 🔬 **UX Researcher** | Expert user experience researcher specializing in user behavior analysis, usability testing, and data-driven design insi... | [`design-ux-researcher.md`](./agents/design/design-ux-researcher.md) |
| 🎬 **Visual Storyteller** | Expert visual communication specialist focused on creating compelling visual narratives, multimedia content, and brand s... | [`design-visual-storyteller.md`](./agents/design/design-visual-storyteller.md) |
| ✨ **Whimsy Injector** | Expert creative specialist focused on adding personality, delight, and playful elements to brand experiences. Creates me... | [`design-whimsy-injector.md`](./agents/design/design-whimsy-injector.md) |

### 📁 Division: Engineering (65 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🧬 **AI Data Remediation Engineer** | Specialist in self-healing data pipelines — uses air-gapped local SLMs and semantic clustering to automatically detect, ... | [`engineering-ai-data-remediation-engineer.md`](./agents/engineering/engineering-ai-data-remediation-engineer.md) |
| 🤖 **AI Engineer** | Expert AI/ML engineer specializing in machine learning model development, deployment, and integration into production sy... | [`engineering-ai-engineer.md`](./agents/engineering/engineering-ai-engineer.md) |
| 🔌 **API Platform Engineer** | Expert API platform engineer for public and partner APIs — contract-first design (OpenAPI/gRPC), versioning and deprecat... | [`engineering-api-platform-engineer.md`](./agents/engineering/engineering-api-platform-engineer.md) |
| 🎯 **ATS Validator Architect** | Architect and validator for Applicant Tracking Systems (ATS) and resume parsers. Combines deterministic information retr... | [`engineering-ats-validator-architect.md`](./agents/engineering/engineering-ats-validator-architect.md) |
| ⚡ **Autonomous Optimization Architect** | Intelligent system governor that continuously shadow-tests APIs for performance while enforcing strict financial and sec... | [`engineering-autonomous-optimization-architect.md`](./agents/engineering/engineering-autonomous-optimization-architect.md) |
| 🏗️ **Backend Architect** | Senior backend architect specializing in scalable system design, database architecture, API development, and cloud infra... | [`engineering-backend-architect.md`](./agents/engineering/engineering-backend-architect.md) |
| 🌏 **China Network Engineer** | Expert in mainland China's mainstream enterprise networking stacks — Huawei VRP, H3C Comware, Ruijie RGOS, and Hillstone... | [`engineering-china-network-engineer.md`](./agents/engineering/engineering-china-network-engineer.md) |
| 🧱 **CMS Developer** | Drupal and WordPress specialist for theme development, custom plugins/modules, content architecture, and code-first CMS ... | [`engineering-cms-developer.md`](./agents/engineering/engineering-cms-developer.md) |
| 👁️ **Code Reviewer** | Expert code reviewer who provides constructive, actionable feedback focused on correctness, maintainability, security, a... | [`engineering-code-reviewer.md`](./agents/engineering/engineering-code-reviewer.md) |
| 🧭 **Codebase Onboarding Engineer** | Expert developer onboarding specialist who helps new engineers understand unfamiliar codebases fast by reading source co... | [`engineering-codebase-onboarding-engineer.md`](./agents/engineering/engineering-codebase-onboarding-engineer.md) |
| 🔧 **Data Engineer** | Expert data engineer specializing in building reliable data pipelines, lakehouse architectures, and scalable data infras... | [`engineering-data-engineer.md`](./agents/engineering/engineering-data-engineer.md) |
| 📈 **Data Visualization Engineer** | Expert data visualization engineer — chart-type selection by data and question, perceptually honest encodings, colorblin... | [`engineering-data-visualization-engineer.md`](./agents/engineering/engineering-data-visualization-engineer.md) |
| 🗄️ **Database Optimizer** | Expert database specialist focusing on schema design, query optimization, indexing strategies, and performance tuning fo... | [`engineering-database-optimizer.md`](./agents/engineering/engineering-database-optimizer.md) |
| 🛟 **Database Reliability Engineer** | Expert database reliability engineer (DBRE) — high availability and replication, automated failover, backup and point-in... | [`engineering-database-reliability-engineer.md`](./agents/engineering/engineering-database-reliability-engineer.md) |
| 💻 **Desktop App Engineer** | Expert desktop application engineer for Electron and Tauri — secure IPC and process isolation, code signing and notariza... | [`engineering-desktop-app-engineer.md`](./agents/engineering/engineering-desktop-app-engineer.md) |
| 🛠️ **Developer Tooling Engineer** | Expert developer-tooling and CLI engineer — building command-line tools and internal developer platforms with great DX: ... | [`engineering-developer-tooling-engineer.md`](./agents/engineering/engineering-developer-tooling-engineer.md) |
| ⚙️ **DevOps Automator** | Expert DevOps engineer specializing in infrastructure automation, CI/CD pipeline development, and cloud operations... | [`engineering-devops-automator.md`](./agents/engineering/engineering-devops-automator.md) |
| ⚡ **Drupal Performance Engineer** | Expert Drupal 10/11 performance engineer specializing in Core Web Vitals, render and dynamic page caching, BigPipe, cach... | [`engineering-drupal-performance.md`](./agents/engineering/engineering-drupal-performance.md) |
| 🛒 **Drupal Shopping Cart Engineer** | Expert Drupal e-commerce engineer specializing in Drupal Commerce for product catalog management, payment gateway integr... | [`engineering-drupal-shopping-cart.md`](./agents/engineering/engineering-drupal-shopping-cart.md) |
| 📧 **Email Intelligence Engineer** | Expert in extracting structured, reasoning-ready data from raw email threads for AI agents and automation systems... | [`engineering-email-intelligence-engineer.md`](./agents/engineering/engineering-email-intelligence-engineer.md) |
| 🔩 **Embedded Firmware Engineer** | Specialist in bare-metal and RTOS firmware - ESP32/ESP-IDF, PlatformIO, Arduino, ARM Cortex-M, STM32 HAL/LL, Nordic nRF5... | [`engineering-embedded-firmware-engineer.md`](./agents/engineering/engineering-embedded-firmware-engineer.md) |
| 🔗 **Feishu Integration Developer** | Full-stack integration expert specializing in the Feishu (Lark) Open Platform — proficient in Feishu bots, mini programs... | [`engineering-feishu-integration-developer.md`](./agents/engineering/engineering-feishu-integration-developer.md) |
| 🔧 **Filament Optimization Specialist** | Expert in restructuring and optimizing Filament PHP admin interfaces for maximum usability and efficiency. Focuses on im... | [`engineering-filament-optimization-specialist.md`](./agents/engineering/engineering-filament-optimization-specialist.md) |
| 💰 **FinOps Engineer** | Expert cloud cost engineer for AWS/GCP/Azure — cost allocation and tagging, rightsizing, commitment planning (reserved i... | [`engineering-finops-engineer.md`](./agents/engineering/engineering-finops-engineer.md) |
| 🖥️ **Frontend Developer** | Expert frontend developer specializing in modern web technologies, React/Vue/Angular frameworks, UI implementation, and ... | [`engineering-frontend-developer.md`](./agents/engineering/engineering-frontend-developer.md) |
| 🗄️ **GaussDB Expert Engineer** | Expert database specialist focusing on GaussDB OLTP — Huawei's self-developed enterprise-grade relational database (NOT ... | [`engineering-gaussdb-expert.md`](./agents/engineering/engineering-gaussdb-expert.md) |
| 🌿 **Git Workflow Master** | Expert in Git workflows, branching strategies, and version control best practices including conventional commits, rebasi... | [`engineering-git-workflow-master.md`](./agents/engineering/engineering-git-workflow-master.md) |
| 🌍 **Internationalization Engineer** | Expert i18n engineer for ICU MessageFormat, CLDR plural rules, RTL and bidirectional layouts, locale-aware date/number/c... | [`engineering-i18n-engineer.md`](./agents/engineering/engineering-i18n-engineer.md) |
| 🔐 **Identity & Access Engineer** | Expert identity engineer for OAuth 2.0/OIDC flows, enterprise SSO (SAML/OIDC) and SCIM provisioning, passkeys/WebAuthn, ... | [`engineering-identity-access-engineer.md`](./agents/engineering/engineering-identity-access-engineer.md) |
| 🚨 **Incident Response Commander** | Expert incident commander specializing in production incident management, structured response coordination, post-mortem ... | [`engineering-incident-response-commander.md`](./agents/engineering/engineering-incident-response-commander.md) |
| 📡 **IoT Fleet Engineer** | Expert IoT and edge fleet engineer — device provisioning and identity, MQTT/telemetry pipelines, staged over-the-air (OT... | [`engineering-iot-fleet-engineer.md`](./agents/engineering/engineering-iot-fleet-engineer.md) |
| 🖧 **IT Service Manager** | Expert IT service management specialist using ITIL 4 framework for service catalog design, incident and problem manageme... | [`engineering-it-service-manager.md`](./agents/engineering/engineering-it-service-manager.md) |
| 🧠 **Knowledge Graph Engineer** | Structures information and capabilities into interconnected nodes (entities) and edges (relationships) — enabling dynami... | [`engineering-knowledge-graph-engineer.md`](./agents/engineering/engineering-knowledge-graph-engineer.md) |
| 🧪 **LLM Post-Training Engineer** | Evidence-driven owner for SFT, preference optimization, RLHF/RLVR, MoE post-training, and the release gates that turn a ... | [`engineering-llm-post-training-engineer.md`](./agents/engineering/engineering-llm-post-training-engineer.md) |
| 🪡 **Minimal Change Engineer** | Engineering specialist focused on minimum-viable diffs — fixes only what was asked, refuses scope creep, prefers three s... | [`engineering-minimal-change-engineer.md`](./agents/engineering/engineering-minimal-change-engineer.md) |
| 📲 **Mobile App Builder** | Specialized mobile application developer with expertise in native iOS/Android development and cross-platform frameworks... | [`engineering-mobile-app-builder.md`](./agents/engineering/engineering-mobile-app-builder.md) |
| 🚀 **Mobile Release Engineer** | Expert mobile release and distribution engineer for iOS and Android — code signing, provisioning, fastlane pipelines, Ap... | [`engineering-mobile-release-engineer.md`](./agents/engineering/engineering-mobile-release-engineer.md) |
| 🕸️ **Multi-Agent Systems Architect** | Systems architect specializing in the design, coordination, and governance of multi-agent AI pipelines — covering topolo... | [`engineering-multi-agent-systems-architect.md`](./agents/engineering/engineering-multi-agent-systems-architect.md) |
| 🌐 **Network Engineer** | Expert network engineer for Cisco IOS/IOS-XE, Cisco ASA/FTD, Juniper Junos, and Palo Alto PAN-OS routing, switching, fir... | [`engineering-network-engineer.md`](./agents/engineering/engineering-network-engineer.md) |
| 📜 **OrgScript Engineer** | Expert in designing, parsing, and implementing OrgScript grammar, AST validation, and business logic definitions.... | [`engineering-orgscript-engineer.md`](./agents/engineering/engineering-orgscript-engineer.md) |
| 💳 **Payments & Billing Engineer** | Expert payments engineer for PSP integrations (Stripe, Adyen, Braintree, PayPal), idempotent payment flows, webhook proc... | [`engineering-payments-billing-engineer.md`](./agents/engineering/engineering-payments-billing-engineer.md) |
| 📑 **PDF Engine Architect** | Architect and specialist in deterministic HTML-to-PDF document compilation, Playwright browser context pools, dynamic Eu... | [`engineering-pdf-engine-architect.md`](./agents/engineering/engineering-pdf-engine-architect.md) |
| 🛤️ **Platform Engineer** | Expert internal developer platform (IDP) engineer specializing in golden paths, paved roads, and self-serve infrastructu... | [`engineering-platform-engineer.md`](./agents/engineering/engineering-platform-engineer.md) |
| 🕵️ **Privacy Engineer** | Expert privacy engineer who implements privacy in code — PII discovery and classification, data minimization, consent en... | [`engineering-privacy-engineer.md`](./agents/engineering/engineering-privacy-engineer.md) |
| 🧬 **Prompt Engineer** | Specialist in crafting, testing, and systematically optimizing prompts for LLMs — turning vague instructions into reliab... | [`engineering-prompt-engineer.md`](./agents/engineering/engineering-prompt-engineer.md) |
| 🔍 **RAG Pipeline Engineer** | Production RAG specialist focused on chunking strategy, retrieval quality, hybrid search, re-ranking, and eval-driven it... | [`engineering-rag-pipeline-engineer.md`](./agents/engineering/engineering-rag-pipeline-engineer.md) |
| ⚡ **Rapid Prototyper** | Specialized in ultra-fast proof-of-concept development and MVP creation using efficient tools and frameworks... | [`engineering-rapid-prototyper.md`](./agents/engineering/engineering-rapid-prototyper.md) |
| 🤝 **Realtime Collaboration Engineer** | Expert realtime systems engineer for WebSocket/SSE infrastructure, presence, CRDT and OT-based collaborative editing, of... | [`engineering-realtime-collaboration-engineer.md`](./agents/engineering/engineering-realtime-collaboration-engineer.md) |
| 🦀 **Rust Refactoring Specialist** | Expert Rust engineer for repository-scale refactoring, safe renames, module restructuring, duplication removal, panic ha... | [`engineering-rust-refactoring-specialist.md`](./agents/engineering/engineering-rust-refactoring-specialist.md) |
| 🔎 **Search Relevance Engineer** | Expert search engineer for Elasticsearch and OpenSearch — index and analyzer design, BM25 query tuning, hybrid lexical+v... | [`engineering-search-relevance-engineer.md`](./agents/engineering/engineering-search-relevance-engineer.md) |
| ♿ **Section 508 Accessibility Specialist** | Expert U.S. federal Section 508 accessibility engineer (the 508 legal baseline is WCAG 2.0 Level AA; WCAG 2.1/2.2 AA are... | [`engineering-section-508-specialist.md`](./agents/engineering/engineering-section-508-specialist.md) |
| 💎 **Senior Developer** | Premium implementation specialist - Masters Laravel/Livewire/FluxUI, advanced CSS, Three.js integration... | [`engineering-senior-developer.md`](./agents/engineering/engineering-senior-developer.md) |
| 🛠️ **ServiceNow Developer & Mentor** | ServiceNow platform developer and step-by-step troubleshooter — Business Rules, Script Includes, GlideRecord/GlideAggreg... | [`engineering-servicenow-developer-mentor.md`](./agents/engineering/engineering-servicenow-developer-mentor.md) |
| 🏛️ **Software Architect** | Expert software architect specializing in system design, domain-driven design, architectural patterns, and technical dec... | [`engineering-software-architect.md`](./agents/engineering/engineering-software-architect.md) |
| ⛓️ **Solidity Smart Contract Engineer** | Expert Solidity developer specializing in EVM smart contract architecture, gas optimization, upgradeable proxy patterns,... | [`engineering-solidity-smart-contract-engineer.md`](./agents/engineering/engineering-solidity-smart-contract-engineer.md) |
| 🛡️ **SRE (Site Reliability Engineer)** | Expert site reliability engineer specializing in SLOs, error budgets, observability, chaos engineering, and toil reducti... | [`engineering-sre.md`](./agents/engineering/engineering-sre.md) |
| 📚 **Technical Writer** | Expert technical writer specializing in developer documentation, API references, README files, and tutorials. Transforms... | [`engineering-technical-writer.md`](./agents/engineering/engineering-technical-writer.md) |
| 📑 **Universal Document Compiler** | Architect of schema-agnostic document ASTs, algorithmic data-shape layout inference, bidirectional CST-to-canvas synchro... | [`engineering-universal-document-compiler.md`](./agents/engineering/engineering-universal-document-compiler.md) |
| 🏛️ **USWDS Developer** | Expert U.S. Web Design System frontend developer specializing in USWDS components and design tokens, accessible-by-defau... | [`engineering-uswds-developer.md`](./agents/engineering/engineering-uswds-developer.md) |
| 🎬 **Video Streaming Engineer** | Expert video streaming engineer for adaptive bitrate delivery — HLS/DASH packaging, ffmpeg transcode ladders, CMAF low-l... | [`engineering-video-streaming-engineer.md`](./agents/engineering/engineering-video-streaming-engineer.md) |
| 🎙️ **Voice AI Integration Engineer** | Expert in building end-to-end speech transcription pipelines using Whisper-style models and cloud ASR services — from ra... | [`engineering-voice-ai-integration-engineer.md`](./agents/engineering/engineering-voice-ai-integration-engineer.md) |
| 🧩 **WebAssembly Engineer** | Expert WebAssembly engineer — compiling Rust/C++/Go to Wasm, JS interop and the boundary marshalling cost, WASI and serv... | [`engineering-webassembly-engineer.md`](./agents/engineering/engineering-webassembly-engineer.md) |
| 💬 **WeChat Mini Program Developer** | Expert WeChat Mini Program developer specializing in 小程序 development with WXML/WXSS/WXS, WeChat API integration, payment... | [`engineering-wechat-mini-program-developer.md`](./agents/engineering/engineering-wechat-mini-program-developer.md) |
| ⚡ **WordPress Performance Engineer** | Expert WordPress performance engineer specializing in Core Web Vitals, object caching (Redis/Memcached), page caching, d... | [`engineering-wordpress-performance.md`](./agents/engineering/engineering-wordpress-performance.md) |
| 🛍️ **WordPress Shopping Cart Engineer** | Expert WordPress e-commerce engineer specializing in WooCommerce for product catalog management, payment gateway integra... | [`engineering-wordpress-shopping-cart.md`](./agents/engineering/engineering-wordpress-shopping-cart.md) |

### 📁 Division: Finance (5 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 📒 **Bookkeeper & Controller** | Expert bookkeeper and controller specializing in day-to-day accounting operations, financial reconciliations, month-end ... | [`finance-bookkeeper-controller.md`](./agents/finance/finance-bookkeeper-controller.md) |
| 📊 **Financial Analyst** | Expert financial analyst specializing in financial modeling, forecasting, scenario analysis, and data-driven decision su... | [`finance-financial-analyst.md`](./agents/finance/finance-financial-analyst.md) |
| 📈 **FP&A Analyst** | Expert Financial Planning & Analysis (FP&A) analyst specializing in budgeting, variance analysis, financial planning, ro... | [`finance-fpa-analyst.md`](./agents/finance/finance-fpa-analyst.md) |
| 🔍 **Investment Researcher** | Expert investment researcher specializing in market research, due diligence, portfolio analysis, and asset valuation. Co... | [`finance-investment-researcher.md`](./agents/finance/finance-investment-researcher.md) |
| 🏛️ **Tax Strategist** | Expert tax strategist specializing in tax optimization, multi-jurisdictional compliance, transfer pricing, and strategic... | [`finance-tax-strategist.md`](./agents/finance/finance-tax-strategist.md) |

### 📁 Division: Game Development (6 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 💰 **Economy Designer** | Virtual economy architect - Masters currency systems, sources and sinks, monetization modeling, inflation control, and d... | [`economy-designer.md`](./agents/game-development/economy-designer.md) |
| 🎵 **Game Audio Engineer** | Interactive audio specialist - Masters FMOD/Wwise integration, adaptive music systems, spatial audio, and audio performa... | [`game-audio-engineer.md`](./agents/game-development/game-audio-engineer.md) |
| 🎮 **Game Designer** | Systems and mechanics architect - Masters GDD authorship, player psychology, economy balancing, and gameplay loop design... | [`game-designer.md`](./agents/game-development/game-designer.md) |
| 🗺️ **Level Designer** | Spatial storytelling and flow specialist - Masters layout theory, pacing architecture, encounter design, and environment... | [`level-designer.md`](./agents/game-development/level-designer.md) |
| 📖 **Narrative Designer** | Story systems and dialogue architect - Masters GDD-aligned narrative design, branching dialogue, lore architecture, and ... | [`narrative-designer.md`](./agents/game-development/narrative-designer.md) |
| 🎨 **Technical Artist** | Art-to-engine pipeline specialist - Masters shaders, VFX systems, LOD pipelines, performance budgeting, and cross-engine... | [`technical-artist.md`](./agents/game-development/technical-artist.md) |

### 📁 Division: GIS (13 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🏔️ **3D & Scene Developer** | Web 3D visualization specialist who creates immersive 3D scenes, terrain models, point cloud visualizations, and interac... | [`gis-3d-scene-developer.md`](./agents/gis/gis-3d-scene-developer.md) |
| 🖥️ **GIS Analyst** | Day-to-day GIS operator who creates maps, manages layers, performs spatial queries, and maintains geospatial data integr... | [`gis-analyst.md`](./agents/gis/gis-analyst.md) |
| 🏗️ **BIM/GIS Specialist** | Integration specialist who bridges Building Information Modeling and Geographic Information Systems — Revit/IFC data con... | [`gis-bim-specialist.md`](./agents/gis/gis-bim-specialist.md) |
| 🎨 **Cartography Designer** | Map aesthetics specialist who designs beautiful, readable, and effective maps — color theory, typography, label placemen... | [`gis-cartography-designer.md`](./agents/gis/gis-cartography-designer.md) |
| 🛸 **Drone/Reality Mapping Specialist** | Photogrammetry and reality capture expert who processes drone imagery into orthomosaics, digital terrain models, point c... | [`gis-drone-reality-mapping.md`](./agents/gis/gis-drone-reality-mapping.md) |
| 🤖 **GeoAI/ML Engineer** | Geospatial machine learning specialist who builds models for feature extraction, object detection, image segmentation, a... | [`gis-geoai-ml-engineer.md`](./agents/gis/gis-geoai-ml-engineer.md) |
| ⚙️ **Geoprocessing Specialist** | ArcPy and Python toolbox expert who automates spatial workflows — builds .pyt toolboxes, Model Builder processes, batch ... | [`gis-geoprocessing-specialist.md`](./agents/gis/gis-geoprocessing-specialist.md) |
| ✅ **GIS QA Engineer** | Quality assurance specialist who validates geospatial data integrity — topology checks, metadata audits, CRS consistency... | [`gis-qa-engineer.md`](./agents/gis/gis-qa-engineer.md) |
| 🔧 **Solution Engineer** | Hands-on GIS prototype builder who takes strategy from Technical Consultant and turns it into working demos, proof-of-co... | [`gis-solution-engineer.md`](./agents/gis/gis-solution-engineer.md) |
| 📦 **Spatial Data Engineer** | ETL specialist who transforms messy geospatial data from any source into clean, standardized, production-ready datasets ... | [`gis-spatial-data-engineer.md`](./agents/gis/gis-spatial-data-engineer.md) |
| 📊 **Spatial Data Scientist** | Advanced spatial analytics specialist who applies statistical modeling, spatial econometrics, clustering, and predictive... | [`gis-spatial-data-scientist.md`](./agents/gis/gis-spatial-data-scientist.md) |
| 🧠 **Technical Consultant** | Strategic GIS advisor who translates business problems into geospatial solutions — gap analysis, technology roadmaps, RF... | [`gis-technical-consultant.md`](./agents/gis/gis-technical-consultant.md) |
| 🌐 **Web GIS Developer** | Full-stack web GIS engineer who builds interactive mapping applications — MapLibre GL JS, ArcGIS JS API, Leaflet, real-t... | [`gis-web-gis-developer.md`](./agents/gis/gis-web-gis-developer.md) |

### 📁 Division: Healthcare (3 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🩺 **Clinical Evidence Agent** | Evidence standards and clinical credibility framework for AI agents... | [`healthcare-clinical-evidence-agent.md`](./agents/healthcare/healthcare-clinical-evidence-agent.md) |
| 🧭 **Healthcare Innovation Strategist** | Strategic narrative architect for healthcare founders operating at... | [`healthcare-innovation-strategist.md`](./agents/healthcare/healthcare-innovation-strategist.md) |
| 🌍 **Sovereign Health Systems Agent** | Government health mandate engagement framework for AI agents... | [`healthcare-sovereign-health-systems-agent.md`](./agents/healthcare/healthcare-sovereign-health-systems-agent.md) |

### 📁 Division: Marketing (37 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🏗️ **AEO Foundations Architect** | Expert in AI Engine Optimization infrastructure — implements llms.txt, AI-aware robots.txt, token-budgeted content, stru... | [`marketing-aeo-foundations.md`](./agents/marketing/marketing-aeo-foundations.md) |
| 🤖 **Agentic Search Optimizer** | Expert in WebMCP readiness and agentic task completion — audits whether AI agents can actually accomplish tasks on your ... | [`marketing-agentic-search-optimizer.md`](./agents/marketing/marketing-agentic-search-optimizer.md) |
| 🔮 **AI Citation Strategist** | Expert in AI recommendation engine optimization (AEO/GEO) — audits brand visibility across ChatGPT, Claude, Gemini, and ... | [`marketing-ai-citation-strategist.md`](./agents/marketing/marketing-ai-citation-strategist.md) |
| 📱 **App Store Optimizer** | Expert app store marketing specialist focused on App Store Optimization (ASO), conversion rate optimization, and app dis... | [`marketing-app-store-optimizer.md`](./agents/marketing/marketing-app-store-optimizer.md) |
| 🇨🇳 **Baidu SEO Specialist** | Expert Baidu search optimization specialist focused on Chinese search engine ranking, Baidu ecosystem integration, ICP c... | [`marketing-baidu-seo-specialist.md`](./agents/marketing/marketing-baidu-seo-specialist.md) |
| 🎬 **Bilibili Content Strategist** | Expert Bilibili marketing specialist focused on UP主 growth, danmaku culture mastery, B站 algorithm optimization, communit... | [`marketing-bilibili-content-strategist.md`](./agents/marketing/marketing-bilibili-content-strategist.md) |
| 📘 **Book Co-Author** | Strategic thought-leadership book collaborator for founders, experts, and operators turning voice notes, fragments, and ... | [`marketing-book-co-author.md`](./agents/marketing/marketing-book-co-author.md) |
| 🎠 **Carousel Growth Engine** | Autonomous TikTok and Instagram carousel generation specialist. Analyzes any website URL with Playwright, generates vira... | [`marketing-carousel-growth-engine.md`](./agents/marketing/marketing-carousel-growth-engine.md) |
| 🛒 **China E-Commerce Operator** | Expert China e-commerce operations specialist covering Taobao, Tmall, Pinduoduo, and JD ecosystems with deep expertise i... | [`marketing-china-ecommerce-operator.md`](./agents/marketing/marketing-china-ecommerce-operator.md) |
| 🇨🇳 **China Market Localization Strategist** | Full-stack China market localization expert who transforms real-time trend signals into executable go-to-market strategi... | [`marketing-china-market-localization-strategist.md`](./agents/marketing/marketing-china-market-localization-strategist.md) |
| ✍️ **Content Creator** | Expert content strategist and creator for multi-platform campaigns. Develops editorial calendars, creates compelling cop... | [`marketing-content-creator.md`](./agents/marketing/marketing-content-creator.md) |
| 🌏 **Cross-Border E-Commerce Specialist** | Full-funnel cross-border e-commerce strategist covering Amazon, Shopee, Lazada, AliExpress, Temu, and TikTok Shop operat... | [`marketing-cross-border-ecommerce.md`](./agents/marketing/marketing-cross-border-ecommerce.md) |
| 🌱 **Developer Community Builder** | Grows and sustains developer communities — Discord servers, GitHub discussions, forums, and contributor programs — turni... | [`marketing-developer-community-builder.md`](./agents/marketing/marketing-developer-community-builder.md) |
| 🎵 **Douyin Strategist** | Short-video marketing expert specializing in the Douyin platform, with deep expertise in recommendation algorithm mechan... | [`marketing-douyin-strategist.md`](./agents/marketing/marketing-douyin-strategist.md) |
| 📧 **Email Marketing Strategist** | Expert email marketing strategist for CRM-driven campaigns, lifecycle automation, segmentation architecture, and deliver... | [`marketing-email-strategist.md`](./agents/marketing/marketing-email-strategist.md) |
| 🎙️ **Global Podcast Strategist** | Expert podcast growth specialist focused on show positioning, audience development, content strategy, and monetisation. ... | [`marketing-global-podcast-strategist.md`](./agents/marketing/marketing-global-podcast-strategist.md) |
| 🚀 **Growth Hacker** | Expert growth strategist specializing in rapid user acquisition through data-driven experimentation. Develops viral loop... | [`marketing-growth-hacker.md`](./agents/marketing/marketing-growth-hacker.md) |
| 📸 **Instagram Curator** | Expert Instagram marketing specialist focused on visual storytelling, community building, and multi-format content optim... | [`marketing-instagram-curator.md`](./agents/marketing/marketing-instagram-curator.md) |
| 🎥 **Kuaishou Strategist** | Expert Kuaishou marketing strategist specializing in short-video content for China's lower-tier city markets, live comme... | [`marketing-kuaishou-strategist.md`](./agents/marketing/marketing-kuaishou-strategist.md) |
| 💼 **LinkedIn Content Creator** | Expert LinkedIn content strategist focused on thought leadership, personal brand building, and high-engagement professio... | [`marketing-linkedin-content-creator.md`](./agents/marketing/marketing-linkedin-content-creator.md) |
| 🎙️ **Livestream Commerce Coach** | Veteran livestream e-commerce coach specializing in host training and live room operations across Douyin, Kuaishou, Taob... | [`marketing-livestream-commerce-coach.md`](./agents/marketing/marketing-livestream-commerce-coach.md) |
| 📡 **Multi-Platform Publisher** | Expert orchestrator for one-click Chinese blog publishing. Routes a single article to 知乎 / 小红书 / CSDN / B站 / 公众号 / 掘金 vi... | [`marketing-multi-platform-publisher.md`](./agents/marketing/marketing-multi-platform-publisher.md) |
| 🎧 **Podcast Strategist** | Content strategy and operations expert for the Chinese podcast market, with deep expertise in Xiaoyuzhou, Ximalaya, and ... | [`marketing-podcast-strategist.md`](./agents/marketing/marketing-podcast-strategist.md) |
| 📣 **PR & Communications Manager** | Strategic public relations and communications specialist for media relations, press releases, crisis communications, exe... | [`marketing-pr-communications-manager.md`](./agents/marketing/marketing-pr-communications-manager.md) |
| 🔒 **Private Domain Operator** | Expert in building enterprise WeChat (WeCom) private domain ecosystems, with deep expertise in SCRM systems, segmented c... | [`marketing-private-domain-operator.md`](./agents/marketing/marketing-private-domain-operator.md) |
| 💬 **Reddit Community Builder** | Expert Reddit marketing specialist focused on authentic community engagement, value-driven content creation, and long-te... | [`marketing-reddit-community-builder.md`](./agents/marketing/marketing-reddit-community-builder.md) |
| 🔍 **SEO Specialist** | Expert search engine optimization strategist specializing in technical SEO, content optimization, link authority buildin... | [`marketing-seo-specialist.md`](./agents/marketing/marketing-seo-specialist.md) |
| 🎬 **Short-Video Editing Coach** | Hands-on short-video editing coach covering the full post-production pipeline, with mastery of CapCut Pro, Premiere Pro,... | [`marketing-short-video-editing-coach.md`](./agents/marketing/marketing-short-video-editing-coach.md) |
| 📣 **Social Media Strategist** | Expert social media strategist for LinkedIn, Twitter, and professional platforms. Creates cross-platform campaigns, buil... | [`marketing-social-media-strategist.md`](./agents/marketing/marketing-social-media-strategist.md) |
| 🎵 **TikTok Strategist** | Expert TikTok marketing specialist focused on viral content creation, algorithm optimization, and community building. Ma... | [`marketing-tiktok-strategist.md`](./agents/marketing/marketing-tiktok-strategist.md) |
| 🐦 **Twitter Engager** | Expert Twitter marketing specialist focused on real-time engagement, thought leadership building, and community-driven g... | [`marketing-twitter-engager.md`](./agents/marketing/marketing-twitter-engager.md) |
| 🎬 **Video Optimization Specialist** | Video marketing strategist specializing in YouTube algorithm optimization, audience retention, chaptering, thumbnail con... | [`marketing-video-optimization-specialist.md`](./agents/marketing/marketing-video-optimization-specialist.md) |
| 📱 **WeChat Official Account Manager** | Expert WeChat Official Account (OA) strategist specializing in content marketing, subscriber engagement, and conversion ... | [`marketing-wechat-official-account.md`](./agents/marketing/marketing-wechat-official-account.md) |
| 🔥 **Weibo Strategist** | Full-spectrum operations expert for Sina Weibo, with deep expertise in trending topic mechanics, Super Topic community m... | [`marketing-weibo-strategist.md`](./agents/marketing/marketing-weibo-strategist.md) |
| 🛰️ **X/Twitter Intelligence Analyst** | Social intelligence specialist for X/Twitter research, trend detection, account monitoring, and evidence-backed audience... | [`marketing-x-twitter-intelligence-analyst.md`](./agents/marketing/marketing-x-twitter-intelligence-analyst.md) |
| 🌸 **Xiaohongshu Specialist** | Expert Xiaohongshu marketing specialist focused on lifestyle content, trend-driven strategies, and authentic community e... | [`marketing-xiaohongshu-specialist.md`](./agents/marketing/marketing-xiaohongshu-specialist.md) |
| 🧠 **Zhihu Strategist** | Expert Zhihu marketing specialist focused on thought leadership, community credibility, and knowledge-driven engagement.... | [`marketing-zhihu-strategist.md`](./agents/marketing/marketing-zhihu-strategist.md) |

### 📁 Division: Paid Media (7 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 📋 **Paid Media Auditor** | Comprehensive paid media auditor who systematically evaluates Google Ads, Microsoft Ads, and Meta accounts across 200+ c... | [`paid-media-auditor.md`](./agents/paid-media/paid-media-auditor.md) |
| ✍️ **Ad Creative Strategist** | Paid media creative specialist focused on ad copywriting, RSA optimization, asset group design, and creative testing fra... | [`paid-media-creative-strategist.md`](./agents/paid-media/paid-media-creative-strategist.md) |
| 📱 **Paid Social Strategist** | Cross-platform paid social advertising specialist covering Meta (Facebook/Instagram), LinkedIn, TikTok, Pinterest, X, an... | [`paid-media-paid-social-strategist.md`](./agents/paid-media/paid-media-paid-social-strategist.md) |
| 💰 **PPC Campaign Strategist** | Senior paid media strategist specializing in large-scale search, shopping, and performance max campaign architecture acr... | [`paid-media-ppc-strategist.md`](./agents/paid-media/paid-media-ppc-strategist.md) |
| 📺 **Programmatic & Display Buyer** | Display advertising and programmatic media buying specialist covering managed placements, Google Display Network, DV360,... | [`paid-media-programmatic-buyer.md`](./agents/paid-media/paid-media-programmatic-buyer.md) |
| 🔍 **Search Query Analyst** | Specialist in search term analysis, negative keyword architecture, and query-to-intent mapping. Turns raw search query d... | [`paid-media-search-query-analyst.md`](./agents/paid-media/paid-media-search-query-analyst.md) |
| 📡 **Tracking & Measurement Specialist** | Expert in conversion tracking architecture, tag management, and attribution modeling across Google Tag Manager, GA4, Goo... | [`paid-media-tracking-specialist.md`](./agents/paid-media/paid-media-tracking-specialist.md) |

### 📁 Division: Product (6 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🧠 **Behavioral Nudge Engine** | Behavioral psychology specialist that adapts software interaction cadences and styles to maximize user motivation and su... | [`product-behavioral-nudge-engine.md`](./agents/product/product-behavioral-nudge-engine.md) |
| 🔬 **DX Engineer** | Removes every unnecessary step between a developer and their first success — SDK samples, onboarding flows, error messag... | [`product-dx-engineer.md`](./agents/product/product-dx-engineer.md) |
| 🔍 **Feedback Synthesizer** | Expert in collecting, analyzing, and synthesizing user feedback from multiple channels to extract actionable product ins... | [`product-feedback-synthesizer.md`](./agents/product/product-feedback-synthesizer.md) |
| 🧭 **Product Manager** | Holistic product leader who owns the full product lifecycle — from discovery and strategy through roadmap, stakeholder a... | [`product-manager.md`](./agents/product/product-manager.md) |
| 🎯 **Sprint Prioritizer** | Expert product manager specializing in agile sprint planning, feature prioritization, and resource allocation. Focused o... | [`product-sprint-prioritizer.md`](./agents/product/product-sprint-prioritizer.md) |
| 🔭 **Trend Researcher** | Expert market intelligence analyst specializing in identifying emerging trends, competitive analysis, and opportunity as... | [`product-trend-researcher.md`](./agents/product/product-trend-researcher.md) |

### 📁 Division: Project Management (7 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🧪 **Experiment Tracker** | Expert project manager specializing in experiment design, execution tracking, and data-driven decision making. Focused o... | [`project-management-experiment-tracker.md`](./agents/project-management/project-management-experiment-tracker.md) |
| 📋 **Jira Workflow Steward** | Expert delivery operations specialist who enforces Jira-linked Git workflows, traceable commits, structured pull request... | [`project-management-jira-workflow-steward.md`](./agents/project-management/project-management-jira-workflow-steward.md) |
| 📋 **Meeting Notes Specialist** | Extract structured decisions, action items, and open questions from meeting transcripts or rough notes into a clean 4-se... | [`project-management-meeting-notes-specialist.md`](./agents/project-management/project-management-meeting-notes-specialist.md) |
| 🐑 **Project Shepherd** | Expert project manager specializing in cross-functional project coordination, timeline management, and stakeholder align... | [`project-management-project-shepherd.md`](./agents/project-management/project-management-project-shepherd.md) |
| 🏭 **Studio Operations** | Expert operations manager specializing in day-to-day studio efficiency, process optimization, and resource coordination.... | [`project-management-studio-operations.md`](./agents/project-management/project-management-studio-operations.md) |
| 🎬 **Studio Producer** | Senior strategic leader specializing in high-level creative and technical project orchestration, resource allocation, an... | [`project-management-studio-producer.md`](./agents/project-management/project-management-studio-producer.md) |
| 📝 **Senior Project Manager** | Converts specs to tasks and remembers previous projects. Focused on realistic scope, no background processes, exact spec... | [`project-manager-senior.md`](./agents/project-management/project-manager-senior.md) |

### 📁 Division: Research (1 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🔍 **Research Synthesist** | Expert in literature review, source evaluation, and evidence synthesis — turns a scattered pile of sources into a struct... | [`research-synthesist.md`](./agents/research/research-synthesist.md) |

### 📁 Division: Sales (9 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🗺️ **Account Strategist** | Expert post-sale account strategist specializing in land-and-expand execution, stakeholder mapping, QBR facilitation, an... | [`sales-account-strategist.md`](./agents/sales/sales-account-strategist.md) |
| 🏋️ **Sales Coach** | Expert sales coaching specialist focused on rep development, pipeline review facilitation, call coaching, deal strategy,... | [`sales-coach.md`](./agents/sales/sales-coach.md) |
| ♟️ **Deal Strategist** | Senior deal strategist specializing in MEDDPICC qualification, competitive positioning, and win planning for complex B2B... | [`sales-deal-strategist.md`](./agents/sales/sales-deal-strategist.md) |
| 🔍 **Discovery Coach** | Coaches sales teams on elite discovery methodology — question design, current-state mapping, gap quantification, and cal... | [`sales-discovery-coach.md`](./agents/sales/sales-discovery-coach.md) |
| 🛠️ **Sales Engineer** | Senior pre-sales engineer specializing in technical discovery, demo engineering, POC scoping, competitive battlecards, a... | [`sales-engineer.md`](./agents/sales/sales-engineer.md) |
| 🧲 **Offer & Lead Gen Strategist** | Top-of-funnel architect who designs irresistible offers and lead magnets that attract qualified buyers at scale. Special... | [`sales-offer-lead-gen-strategist.md`](./agents/sales/sales-offer-lead-gen-strategist.md) |
| 🎯 **Outbound Strategist** | Signal-based outbound specialist who designs multi-channel prospecting sequences, defines ICPs, and builds pipeline thro... | [`sales-outbound-strategist.md`](./agents/sales/sales-outbound-strategist.md) |
| 📊 **Pipeline Analyst** | Revenue operations analyst specializing in pipeline health diagnostics, deal velocity analysis, forecast accuracy, and d... | [`sales-pipeline-analyst.md`](./agents/sales/sales-pipeline-analyst.md) |
| 🏹 **Proposal Strategist** | Strategic proposal architect who transforms RFPs and sales opportunities into compelling win narratives. Specializes in ... | [`sales-proposal-strategist.md`](./agents/sales/sales-proposal-strategist.md) |

### 📁 Division: Security (12 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🔎 **AI-Generated Code Security Auditor** | Security reviewer for AI-generated and vibe-coded apps — hunts the hardcoded secrets, broken row-level security, and pro... | [`security-ai-generated-code-auditor.md`](./agents/security/security-ai-generated-code-auditor.md) |
| 🔐 **Application Security Engineer** | AppSec specialist who secures the software development lifecycle through threat modeling, secure code review, SAST/DAST ... | [`security-appsec-engineer.md`](./agents/security/security-appsec-engineer.md) |
| 🛡️ **Security Architect** | Expert security architect specializing in threat modeling, secure-by-design architecture, trust-boundary analysis, defen... | [`security-architect.md`](./agents/security/security-architect.md) |
| 🛡️ **Blockchain Security Auditor** | Expert smart contract security auditor specializing in vulnerability detection, formal verification, exploit analysis, a... | [`security-blockchain-security-auditor.md`](./agents/security/security-blockchain-security-auditor.md) |
| ☁️ **Cloud Security Architect** | Cloud-native security specialist designing zero trust architectures, implementing defense-in-depth across AWS, Azure, an... | [`security-cloud-security-architect.md`](./agents/security/security-cloud-security-architect.md) |
| 📋 **Compliance Auditor** | Expert technical compliance auditor specializing in SOC 2, ISO 27001, HIPAA, and PCI-DSS audits — from readiness assessm... | [`security-compliance-auditor.md`](./agents/security/security-compliance-auditor.md) |
| 🚨 **Incident Responder** | Digital forensics and incident response specialist who leads breach investigations, contains active threats, coordinates... | [`security-incident-responder.md`](./agents/security/security-incident-responder.md) |
| 🗡️ **Penetration Tester** | Offensive security specialist conducting authorized penetration tests, red team operations, and vulnerability assessment... | [`security-penetration-tester.md`](./agents/security/security-penetration-tester.md) |
| 🔑 **Secrets & Credential Hygiene Engineer** | Owns the full lifecycle of secrets and credentials — detection, prevention, vaulting, rotation, and leak response — so a... | [`security-secrets-credential-engineer.md`](./agents/security/security-secrets-credential-engineer.md) |
| 🛡️ **Senior SecOps Engineer** | Defensive application security specialist who scans every code submission for secrets and sensitive data exposure before... | [`security-senior-secops.md`](./agents/security/security-senior-secops.md) |
| 🎯 **Threat Detection Engineer** | Expert detection engineer specializing in SIEM rule development, MITRE ATT&CK coverage mapping, threat hunting, alert tu... | [`security-threat-detection-engineer.md`](./agents/security/security-threat-detection-engineer.md) |
| 🔍 **Threat Intelligence Analyst** | Cyber threat intelligence specialist who tracks adversary groups, maps attack campaigns to MITRE ATT&CK, produces action... | [`security-threat-intelligence-analyst.md`](./agents/security/security-threat-intelligence-analyst.md) |

### 📁 Division: Spatial Computing (6 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 🍎 **macOS Spatial/Metal Engineer** | Native Swift and Metal specialist building high-performance 3D rendering systems and spatial computing experiences for m... | [`macos-spatial-metal-engineer.md`](./agents/spatial-computing/macos-spatial-metal-engineer.md) |
| 🖥️ **Terminal Integration Specialist** | Terminal emulation, text rendering optimization, and SwiftTerm integration for modern Swift applications... | [`terminal-integration-specialist.md`](./agents/spatial-computing/terminal-integration-specialist.md) |
| 🥽 **visionOS Spatial Engineer** | Native visionOS spatial computing, SwiftUI volumetric interfaces, and Liquid Glass design implementation... | [`visionos-spatial-engineer.md`](./agents/spatial-computing/visionos-spatial-engineer.md) |
| 🕹️ **XR Cockpit Interaction Specialist** | Specialist in designing and developing immersive cockpit-based control systems for XR environments... | [`xr-cockpit-interaction-specialist.md`](./agents/spatial-computing/xr-cockpit-interaction-specialist.md) |
| 🌐 **XR Immersive Developer** | Expert WebXR and immersive technology developer with specialization in browser-based AR/VR/XR applications... | [`xr-immersive-developer.md`](./agents/spatial-computing/xr-immersive-developer.md) |
| 🫧 **XR Interface Architect** | Spatial interaction designer and interface strategist for immersive AR/VR/XR environments... | [`xr-interface-architect.md`](./agents/spatial-computing/xr-interface-architect.md) |

### 📁 Division: Specialized (59 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 💸 **Accounts Payable Agent** | Autonomous payment processing specialist that executes vendor payments, contractor invoices, and recurring bills across ... | [`accounts-payable-agent.md`](./agents/specialized/accounts-payable-agent.md) |
| 🔐 **Agentic Identity & Trust Architect** | Designs identity, authentication, and trust verification systems for autonomous AI agents operating in multi-agent envir... | [`agentic-identity-trust.md`](./agents/specialized/agentic-identity-trust.md) |
| 🎛️ **Agents Orchestrator** | Autonomous pipeline manager that orchestrates the entire development workflow. You are the leader of this process.... | [`agents-orchestrator.md`](./agents/specialized/agents-orchestrator.md) |
| ⚙️ **Automation Governance Architect** | Governance-first architect for business automations (n8n-first) who audits value, risk, and maintainability before imple... | [`automation-governance-architect.md`](./agents/specialized/automation-governance-architect.md) |
| ♟️ **Business Strategist** | Senior management consulting specialist for competitive analysis, market entry strategy, business model design, growth p... | [`business-strategist.md`](./agents/specialized/business-strategist.md) |
| 🔄 **Change Management Consultant** | Expert change management specialist using ADKAR, Kotter, and Prosci frameworks to guide organizations through technology... | [`change-management-consultant.md`](./agents/specialized/change-management-consultant.md) |
| 💼 **Chief Financial Officer** | Strategic finance executive who governs capital allocation, treasury operations, financial planning, M&A finance, invest... | [`chief-financial-officer.md`](./agents/specialized/chief-financial-officer.md) |
| 📚 **Corporate Training Designer** | Expert in enterprise training system design and curriculum development — proficient in training needs analysis, instruct... | [`corporate-training-designer.md`](./agents/specialized/corporate-training-designer.md) |
| 🎧 **Customer Service** | Friendly, professional customer service specialist for any industry — handling inquiries, complaints, account support, F... | [`customer-service.md`](./agents/specialized/customer-service.md) |
| 🌟 **Customer Success Manager** | Strategic customer success specialist for onboarding, health scoring, QBR facilitation, churn prevention, expansion iden... | [`customer-success-manager.md`](./agents/specialized/customer-success-manager.md) |
| 🗄️ **Data Consolidation Agent** | AI agent that consolidates extracted sales data into live reporting dashboards with territory, rep, and pipeline summari... | [`data-consolidation-agent.md`](./agents/specialized/data-consolidation-agent.md) |
| 🔐 **Data Privacy Officer** | Corporate data privacy specialist and DPO who builds GDPR, CCPA, and global privacy compliance programs — covering data ... | [`data-privacy-officer.md`](./agents/specialized/data-privacy-officer.md) |
| 🌱 **ESG & Sustainability Officer** | Corporate sustainability strategist and ESG reporting specialist who builds environmental, social, and governance progra... | [`esg-sustainability-officer.md`](./agents/specialized/esg-sustainability-officer.md) |
| 🏛️ **Government Digital Presales Consultant** | Presales expert for China's government digital transformation market (ToG), proficient in policy interpretation, solutio... | [`government-digital-presales-consultant.md`](./agents/specialized/government-digital-presales-consultant.md) |
| 📝 **Grant Writer** | Expert grant writing specialist for nonprofits, research institutions, and social enterprises — covering prospect resear... | [`grant-writer.md`](./agents/specialized/grant-writer.md) |
| 🧡 **Aging Parent Care Companion** | Compassionate, HIPAA-aligned care coordination and decision-support agent for family caregivers managing an aging parent... | [`healthcare-aging-parent-care-companion.md`](./agents/specialized/healthcare-aging-parent-care-companion.md) |
| 🏥 **Healthcare Customer Service** | Empathetic healthcare customer service specialist for patient support, billing inquiries, appointment management, insura... | [`healthcare-customer-service.md`](./agents/specialized/healthcare-customer-service.md) |
| ⚕️ **Healthcare Marketing Compliance Specialist** | Expert in healthcare marketing compliance in China, proficient in the Advertising Law, Medical Advertisement Management ... | [`healthcare-marketing-compliance.md`](./agents/specialized/healthcare-marketing-compliance.md) |
| 🏨 **Hospitality Guest Services** | Comprehensive hospitality guest services specialist for hotels, resorts, restaurants, and event venues — covering reserv... | [`hospitality-guest-services.md`](./agents/specialized/hospitality-guest-services.md) |
| 🤝 **HR Onboarding** | Comprehensive HR onboarding specialist for employee orientation, documentation management, compliance tracking, benefits... | [`hr-onboarding.md`](./agents/specialized/hr-onboarding.md) |
| 🕸️ **Identity Graph Operator** | Operates a shared identity graph that multiple AI agents resolve against. Ensures every agent in a multi-agent system ge... | [`identity-graph-operator.md`](./agents/specialized/identity-graph-operator.md) |
| 🌐 **Language Translator** | Real-time Spanish ↔ English translation specialist with cultural context, regional dialect awareness, travel phrase guid... | [`language-translator.md`](./agents/specialized/language-translator.md) |
| ⏱️ **Legal Billing & Time Tracking** | Comprehensive legal billing and time tracking specialist for accurate time capture, invoice generation, billing narrativ... | [`legal-billing-time-tracking.md`](./agents/specialized/legal-billing-time-tracking.md) |
| 📋 **Legal Client Intake** | Comprehensive legal client intake specialist for qualifying prospects, collecting case information, scheduling consultat... | [`legal-client-intake.md`](./agents/specialized/legal-client-intake.md) |
| ⚖️ **Legal Document Review** | Comprehensive legal document review specialist for contracts, litigation documents, and real estate agreements — summari... | [`legal-document-review.md`](./agents/specialized/legal-document-review.md) |
| 🏦 **Loan Officer Assistant** | Comprehensive loan officer assistant for mortgage and lending professionals — covering borrower intake, pre-qualificatio... | [`loan-officer-assistant.md`](./agents/specialized/loan-officer-assistant.md) |
| 🔎 **LSP/Index Engineer** | Language Server Protocol specialist building unified code intelligence systems through LSP client orchestration and sema... | [`lsp-index-engineer.md`](./agents/specialized/lsp-index-engineer.md) |
| 🤝 **M&A Integration Manager** | Mergers and acquisitions integration specialist who designs and executes post-merger integration programs — covering Day... | [`ma-integration-manager.md`](./agents/specialized/ma-integration-manager.md) |
| 🏥 **Medical Billing & Coding Specialist** | Expert medical billing and coding specialist for ICD-10-CM/PCS, CPT, and HCPCS coding, claim submission, denial manageme... | [`medical-billing-coding-specialist.md`](./agents/specialized/medical-billing-coding-specialist.md) |
| ⚙️ **Operations Manager** | Business operations specialist who applies Lean, Six Sigma, and systems thinking to process mapping, capacity planning, ... | [`operations-manager.md`](./agents/specialized/operations-manager.md) |
| 🧠 **Organizational Psychologist** | Applied organizational psychologist who diagnoses team dynamics, psychological safety, burnout risk, and culture health ... | [`organizational-psychologist.md`](./agents/specialized/organizational-psychologist.md) |
| 🌱 **Personal Growth Mentor** | Cross-domain personal development mentor for goal clarity, habit design, strategic decisions, and accountability without... | [`personal-growth-mentor.md`](./agents/specialized/personal-growth-mentor.md) |
| 🏠 **Real Estate Buyer & Seller** | Comprehensive real estate agent assistant for buyer representation, seller representation, listing management, offer neg... | [`real-estate-buyer-seller.md`](./agents/specialized/real-estate-buyer-seller.md) |
| 🎯 **Recruitment Specialist** | Expert recruitment operations and talent acquisition specialist — skilled in China's major hiring platforms, talent asse... | [`recruitment-specialist.md`](./agents/specialized/recruitment-specialist.md) |
| 📤 **Report Distribution Agent** | AI agent that automates distribution of consolidated sales reports to representatives based on territorial parameters... | [`report-distribution-agent.md`](./agents/specialized/report-distribution-agent.md) |
| 🧾 **Resume Tailor** | Candidate-side resume optimization specialist who analyzes job descriptions, maps real experience to role requirements, ... | [`resume-tailor.md`](./agents/specialized/resume-tailor.md) |
| 🛒 **Retail Customer Returns** | Comprehensive retail customer returns specialist for processing returns, exchanges, and refunds across in-store, online,... | [`retail-customer-returns.md`](./agents/specialized/retail-customer-returns.md) |
| 📊 **Sales Data Extraction Agent** | AI agent specialized in monitoring Excel files and extracting key sales metrics (MTD, YTD, Year End) for internal live r... | [`sales-data-extraction-agent.md`](./agents/specialized/sales-data-extraction-agent.md) |
| 🎯 **Sales Outreach** | Consultative B2B sales outreach specialist for cold prospecting, lead follow-up, objection handling, proposal writing, a... | [`sales-outreach.md`](./agents/specialized/sales-outreach.md) |
| 🧭 **Chief of Staff** | Master coordinator for founders and executives — filters noise, owns processes, enforces consistency, routes decisions, ... | [`specialized-chief-of-staff.md`](./agents/specialized/specialized-chief-of-staff.md) |
| 🏗️ **Civil Engineer** | Expert civil and structural engineer with global standards coverage — Eurocode, DIN, ACI, AISC, ASCE, AS/NZS, CSA, GB, I... | [`specialized-civil-engineer.md`](./agents/specialized/specialized-civil-engineer.md) |
| 🏺 **Codebase Archaeologist** | Multi-session, multi-tool drift detection specialist who audits codebases touched by several AI coding tools (Claude, Cu... | [`specialized-codebase-archaeologist.md`](./agents/specialized/specialized-codebase-archaeologist.md) |
| 🌍 **Cultural Intelligence Strategist** | CQ specialist that detects invisible exclusion, researches global context, and ensures software resonates authentically ... | [`specialized-cultural-intelligence-strategist.md`](./agents/specialized/specialized-cultural-intelligence-strategist.md) |
| 🗣️ **Developer Advocate** | Expert developer advocate specializing in building developer communities, creating compelling technical content, optimiz... | [`specialized-developer-advocate.md`](./agents/specialized/specialized-developer-advocate.md) |
| 📄 **Document Generator** | Expert document creation specialist who generates professional PDF, PPTX, DOCX, and XLSX files using code-based approach... | [`specialized-document-generator.md`](./agents/specialized/specialized-document-generator.md) |
| 🛡️ **FedRAMP & RMF Compliance Engineer** | Expert FedRAMP and NIST Risk Management Framework compliance engineer specializing in both FedRAMP authorization pathway... | [`specialized-fedramp-rmf-compliance.md`](./agents/specialized/specialized-fedramp-rmf-compliance.md) |
| 🎧 **Focus Music Architect** | Instrumental focus music specialist and neuroacoustic prompt engineer — crafts high-yield prompts, soundscape architectu... | [`specialized-focus-music-architect.md`](./agents/specialized/specialized-focus-music-architect.md) |
| 🇫🇷 **French Consulting Market Navigator** | Navigate the French ESN/SI freelance ecosystem — margin models, platform mechanics (Malt, collective.work), portage sala... | [`specialized-french-consulting-market.md`](./agents/specialized/specialized-french-consulting-market.md) |
| 🇰🇷 **Korean Business Navigator** | Korean business culture for foreign professionals — 품의 decision process, nunchi reading, KakaoTalk business etiquette, h... | [`specialized-korean-business-navigator.md`](./agents/specialized/specialized-korean-business-navigator.md) |
| 🏛️ **Master Plan Architect** | Master planning architect, technical educator, and ruthless plan critic who specializes in deep architectural teaching, ... | [`specialized-master-plan-architect.md`](./agents/specialized/specialized-master-plan-architect.md) |
| 🔌 **MCP Builder** | Expert Model Context Protocol developer who designs, builds, and tests MCP servers that extend AI agent capabilities wit... | [`specialized-mcp-builder.md`](./agents/specialized/specialized-mcp-builder.md) |
| 🔬 **Model QA Specialist** | Independent model QA expert who audits ML and statistical models end-to-end - from documentation review and data reconst... | [`specialized-model-qa.md`](./agents/specialized/specialized-model-qa.md) |
| 💰 **Pricing Analyst** | Specialized pricing analyst who develops optimal pricing models through market research, competitor analysis, cost struc... | [`specialized-pricing-analyst.md`](./agents/specialized/specialized-pricing-analyst.md) |
| ☁️ **Salesforce Architect** | Solution architecture for Salesforce platform — multi-cloud design, integration patterns, governor limits, deployment st... | [`specialized-salesforce-architect.md`](./agents/specialized/specialized-salesforce-architect.md) |
| ⚔️ **Strategy Duel Agent** | Conducts live strategy duels using game theory and the 36 Chinese stratagems... | [`specialized-strategy-duel-agent.md`](./agents/specialized/specialized-strategy-duel-agent.md) |
| 🗺️ **Workflow Architect** | Workflow design specialist who maps complete workflow trees for every system, user journey, and agent interaction — cove... | [`specialized-workflow-architect.md`](./agents/specialized/specialized-workflow-architect.md) |
| 🎓 **Study Abroad Advisor** | Full-spectrum study abroad planning expert covering the US, UK, Canada, Australia, Europe, Hong Kong, and Singapore — pr... | [`study-abroad-advisor.md`](./agents/specialized/study-abroad-advisor.md) |
| 🔗 **Supply Chain Strategist** | Expert supply chain management and procurement strategy specialist — skilled in supplier development, strategic sourcing... | [`supply-chain-strategist.md`](./agents/specialized/supply-chain-strategist.md) |
| 🗃️ **ZK Steward** | Knowledge-base steward in the spirit of Niklas Luhmann's Zettelkasten. Default perspective: Luhmann; switches to domain ... | [`zk-steward.md`](./agents/specialized/zk-steward.md) |

### 📁 Division: Support (6 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| 📊 **Analytics Reporter** | Expert data analyst transforming raw data into actionable business insights. Creates dashboards, performs statistical an... | [`support-analytics-reporter.md`](./agents/support/support-analytics-reporter.md) |
| 📝 **Executive Summary Generator** | Consultant-grade AI specialist trained to think and communicate like a senior strategy consultant. Transforms complex bu... | [`support-executive-summary-generator.md`](./agents/support/support-executive-summary-generator.md) |
| 💰 **Finance Tracker** | Expert financial analyst and controller specializing in financial planning, budget management, and business performance ... | [`support-finance-tracker.md`](./agents/support/support-finance-tracker.md) |
| 🏢 **Infrastructure Maintainer** | Expert infrastructure specialist focused on system reliability, performance optimization, and technical operations manag... | [`support-infrastructure-maintainer.md`](./agents/support/support-infrastructure-maintainer.md) |
| ⚖️ **Legal Compliance Checker** | Expert legal and compliance specialist ensuring business operations, data handling, and content creation comply with rel... | [`support-legal-compliance-checker.md`](./agents/support/support-legal-compliance-checker.md) |
| 💬 **Support Responder** | Expert customer support specialist delivering exceptional customer service, issue resolution, and user experience optimi... | [`support-support-responder.md`](./agents/support/support-support-responder.md) |

### 📁 Division: Testing (9 Specialists)
| Specialist | Focus & Description | Specification File |
| :--- | :--- | :--- |
| ♿ **Accessibility Auditor** | Expert accessibility specialist who audits interfaces against WCAG standards, tests with assistive technologies, and ens... | [`testing-accessibility-auditor.md`](./agents/testing/testing-accessibility-auditor.md) |
| 🔌 **API Tester** | Expert API testing specialist focused on comprehensive API validation, performance testing, and quality assurance across... | [`testing-api-tester.md`](./agents/testing/testing-api-tester.md) |
| 📸 **Evidence Collector** | Screenshot-obsessed, fantasy-allergic QA specialist - Reports reproducible issues with evidence and marks untested scope... | [`testing-evidence-collector.md`](./agents/testing/testing-evidence-collector.md) |
| ⏱️ **Performance Benchmarker** | Expert performance testing and optimization specialist focused on measuring, analyzing, and improving system performance... | [`testing-performance-benchmarker.md`](./agents/testing/testing-performance-benchmarker.md) |
| 🧐 **Reality Checker** | Stops fantasy approvals, evidence-based certification - Default to "NEEDS WORK", requires overwhelming proof for product... | [`testing-reality-checker.md`](./agents/testing/testing-reality-checker.md) |
| 🎭 **Test Automation Engineer** | Expert end-to-end test automation engineer for Playwright and Cypress — resilient selectors, flake elimination, isolated... | [`testing-test-automation-engineer.md`](./agents/testing/testing-test-automation-engineer.md) |
| 📋 **Test Results Analyzer** | Expert test analysis specialist focused on comprehensive test result evaluation, quality metrics analysis, and actionabl... | [`testing-test-results-analyzer.md`](./agents/testing/testing-test-results-analyzer.md) |
| 🔧 **Tool Evaluator** | Expert technology assessment specialist focused on evaluating, testing, and recommending tools, software, and platforms ... | [`testing-tool-evaluator.md`](./agents/testing/testing-tool-evaluator.md) |
| ⚡ **Workflow Optimizer** | Expert process improvement specialist focused on analyzing, optimizing, and automating workflows across all business fun... | [`testing-workflow-optimizer.md`](./agents/testing/testing-workflow-optimizer.md) |

