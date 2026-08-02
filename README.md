# ColdEmailKit

<p align="center">
  Find the best cold email tools for your outreach.
  <br />
  <a href="https://coldemailkit.com"><strong>Learn more »</strong></a>
  <br />
  <br />
  <a href="https://coldemailkit.com">Website</a>
  ·
  <a href="https://github.com/mshiv11/ColdEmailKit/issues">Issues</a>
</p>

<p align="center">
   <a href="https://github.com/mshiv11/ColdEmailKit/stargazers"><img src="https://img.shields.io/github/stars/mshiv11/ColdEmailKit" alt="Github Stars" /></a>
   <a href="https://github.com/mshiv11/ColdEmailKit/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mshiv11/ColdEmailKit" alt="License" /></a>
</p>

## About this project

ColdEmailKit is a community-driven directory of **cold email tools**.

Our goal is to be your first stop when researching for a new service to help you grow your business through cold email outreach. We will help you **find and compare** the best tools available.

Join us in creating the biggest **directory of cold email tools**.

---

## License & Attribution

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

### Attribution Notice

This project is a modified version of [OpenAlternative](https://github.com/piotrkulpinski/openalternative) by [Piotr Kulpinski](https://github.com/piotrkulpinski), originally licensed under GPL-3.0.

| Field | Value |
|-------|-------|
| **Original Project** | [OpenAlternative](https://github.com/piotrkulpinski/openalternative) |
| **Original Author** | [Piotr Kulpinski](https://github.com/piotrkulpinski) |
| **Modified By** | [mshiv11](https://github.com/mshiv11) |
| **Date of First Modification** | December 22, 2024 |
| **Latest Modification** | April 21, 2026 |

### Summary of Changes

The following major changes have been made from the original project:

- Rebranded as **ColdEmailKit** with focus on cold email tools and outreach software
- Updated content, metadata, and branding throughout the application
- Added proprietary rating algorithm for tool trust scores
- Enhanced admin panel with additional features for tool management
- Added integration management for cold email tool connections
- Implemented SEO schema markup for improved search visibility
- Updated payment integration from Stripe to Dodo Payments
- Migrated database from Neon to **Supabase** (PostgreSQL)
- Migrated hosting and background jobs from Vercel/Inngest to **Railway**
- Added AI-powered content generation using **Claude (Anthropic)** with streaming via Vercel AI SDK
- Added programmatic comparison page generation with streaming AI content
- Replaced Plausible analytics with **PostHog**
- Added tool ownership, claiming, and verified badge system
- Migrated blog architecture from static MDX files to a dynamic, database-backed system using Prisma and next-mdx-remote
- Various feature enhancements and bug fixes

### GPL-3.0 Compliance

This derivative work is also licensed under [GPL-3.0](LICENSE). In compliance with GPL-3.0:

1. **Source Code Availability**: The complete source code is available at [https://github.com/mshiv11/ColdEmailKit](https://github.com/mshiv11/ColdEmailKit)
2. **License Preservation**: This project maintains the same GPL-3.0 license as the original
3. **Modification Notice**: All modifications are documented in this README and git history
4. **No Warranty**: This software is provided "as is" without warranty of any kind

```
ColdEmailKit - A directory of cold email tools
Copyright (C) 2024-2026 mshiv11

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
```

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router with Turbopack)
- **Runtime**: [Bun](https://bun.sh/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL) with [Prisma](https://www.prisma.io/)
- **Hosting**: [Railway](https://railway.app/)
- **Search**: PostgreSQL full-text / Prisma database queries (Native, no external service required)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) with [Anthropic Claude](https://anthropic.com/), [Google Gemini](https://ai.google.dev/), and [Mistral](https://mistral.ai/) (fallback)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Email**: [Resend](https://resend.com/) with [React Email](https://react.email/)
- **Analytics**: [PostHog](https://posthog.com/)

---

## Services

ColdEmailKit uses the following third-party services:

| Service | Purpose | Website |
|---------|---------|---------|
| **Supabase** | PostgreSQL Database | [supabase.com](https://supabase.com/) |
| **Railway** | Hosting & Background Jobs | [railway.app](https://railway.app/) |
| **PostgreSQL Search** | Database Search (Prisma) | Native |
| **Upstash** | Redis Cache & Rate Limiting | [upstash.com](https://upstash.com/) |
| **PostHog** | Web & Product Analytics | [posthog.com](https://posthog.com/) |
| **Beehiiv** | Newsletter | [beehiiv.com](https://www.beehiiv.com/?via=mshiv) |
| **Resend** | Transactional Email | [resend.com](https://resend.com/) |
| **Cloudflare R2** | File Storage | [cloudflare.com/r2](https://developers.cloudflare.com/r2/) |
| **Dodo Payments** | Payment Processing | [dodopayments.com](https://dodopayments.com/) |
| **ScreenshotOne** | Website Screenshots | [screenshotone.com](https://screenshotone.com/?via=mshiv) |
| **Anthropic** | AI Content Generation (Claude) | [anthropic.com](https://anthropic.com/) |
| **Jina AI** | Web Search & Scraping | [jina.ai](https://jina.ai/) |
| **Firecrawl** | Web Scraping (Fallback) | [firecrawl.dev](https://firecrawl.link/mshiv) |

Make sure to set up accounts with these services and add the necessary environment variables to your `.env` file.

---

## Project Structure

```
/
├── app/                    # Next.js App Router pages and layouts
│   ├── (web)/             # Public-facing website routes
│   ├── admin/             # Admin panel routes
│   └── api/               # API routes
├── components/            # Reusable React components
│   ├── admin/            # Admin-specific components
│   ├── common/           # Shared components
│   └── web/              # Website components
├── lib/                   # Core utilities and business logic
├── actions/               # Server actions
├── hooks/                 # React hooks
├── contexts/              # React context providers
├── services/              # Third-party service integrations
├── emails/                # Email templates (React Email)
├── server/                # Server-side code
├── functions/             # Utility functions
├── config/                # Configuration files
├── content/               # Content management (MDX)
├── prisma/                # Prisma schema and migrations
├── types/                 # TypeScript type definitions
├── public/                # Static assets
└── scripts/               # Build and utility scripts
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.2 or later)
- [PostgreSQL](https://www.postgresql.org/) database (recommended: [Supabase](https://supabase.com/))
- Node.js 18+ (for some dependencies)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mshiv11/ColdEmailKit-Open-Source.git
   cd ColdEmailKit-Open-Source
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file and add your service credentials. See [Environment Variables](#environment-variables) for details.

4. **Set up the database**

   ```bash
   bun run db:push
   ```

5. **Start the development server**

   ```bash
   bun run dev
   ```

   The application will be available at http://localhost:5173

### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

| Category | Variables | Required |
|----------|-----------|----------|
| **Site** | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_EMAIL` | ✅ |
| **Database** | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | ✅ |
| **Auth** | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, OAuth credentials | ✅ |
| **Search** | `MEILISEARCH_HOST`, `MEILISEARCH_ADMIN_KEY` | Optional (Uses PostgreSQL search) |
| **Cache** | `REDIS_REST_URL`, `REDIS_REST_TOKEN` | ✅ |
| **Email** | `RESEND_API_KEY`, `RESEND_SENDER_EMAIL` | ✅ |
| **Storage** | S3 configuration variables | ✅ |
| **AI** | API keys for Google, Anthropic, OpenAI, etc. | ✅ |
| **Analytics** | PostHog configuration | ✅ |
| **Payments** | Dodo Payments configuration | ✅ |
| **Social** | Twitter, Bluesky, Mastodon credentials | Optional |

See `.env.example` for a complete list with descriptions and links to service documentation.

---

## Commands

All commands are run from the root of the project:

| Command | Action |
|:--------|:-------|
| `bun install` | Install dependencies |
| `bun run dev` | Start local dev server at `localhost:5173` |
| `bun run build` | Build production application |
| `bun run start` | Start production server |
| `bun run lint` | Run linter (Biome) |
| `bun run format` | Format code |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:studio` | Start Prisma Studio |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:pull` | Pull Prisma schema from database |
| `bun run db:reset` | Reset Prisma schema |
| `npm run db:backup` | Full PostgreSQL database snapshot (Local + Cloudflare R2) |
| `bun run email` | Start React Email development server |

## 🛡️ Database Environment Isolation (Dev vs. Production)

To prevent accidental data wipes during local development, schema migrations, or AI agent executions, ColdEmailKit enforces strict separation between the **Development Database** and the **Production Database**:

| Environment | Project Name | Supabase Ref | Purpose & Scope |
|-------------|--------------|--------------|-----------------|
| **Production** | `CEK` | `phpsekmsbokkrtlkdtli` | **Live Production Site Only** — Configured exclusively inside Railway environment variables. Never connected to local dev or experimental scripts. |
| **Development** | `CEK-Dev` | `esmqbinlxysmrcqzjcvo` | **Local Dev & AI Testing** — Configured in `.env.local` for local `bun run dev`, AI agent runs, and schema testing. |

### 🚨 Mandatory Development Prerequisite (HARD RULE)

- **ALL AI Prompt Executions & Feature Implementations MUST Run in Dev (`CEK-Dev`)**: Every code change, feature request, schema modification, and AI assistant task MUST be executed exclusively in the Development Environment (`CEK-Dev`).
- **Production Isolation**: Under no circumstances should local AI agents or local development scripts connect to or execute commands against the Production Database (`CEK`).
- **Production Promotion**: Production updates occur **only** after changes are verified in `CEK-Dev` and pushed to the `main` branch on GitHub for Railway deployment.

### How Environment Isolation Prevents Data Loss

1. **Local AI & Dev Operations Target `CEK-Dev`**: Any experimental schema refactoring, `prisma db push`, or automated testing operates solely on the isolated `CEK-Dev` database.
2. **Production Protected on Railway**: Production credentials exist only in Railway's environment configuration. Pushing code to `main` triggers Railway to build and apply production migrations safely.
3. **Offsite R2 Backups**: Running `npm run db:backup` creates an immediate snapshot locally and uploads it to Cloudflare R2 before any major change.

---

## Database Backups & Data Protection

ColdEmailKit includes an automated, offsite database backup system that dumps all 31 PostgreSQL tables directly from `pg_class` without schema model dependencies.

### Running a Backup

Run a backup on demand anytime (creates a gzipped snapshot locally and uploads to Cloudflare R2):

```bash
npm run db:backup
```

- **Local Snapshot Location**: `backups/local/<timestamp>/`
- **Offsite Cloudflare R2 Location**: `s3://<S3_BUCKET>/db-backups/<timestamp>/`
- **Output Format**: Gzipped JSON for each table (`Tool.json.gz`, `Comparison.json.gz`, etc.) + `manifest.json`.

---

## 🚨 Incident Post-Mortem: Database Reset Prevention

### What Caused the Database Data Loss?

During major schema refactoring (adding enums like `AuthSetup`, `WarmupAvailability`, `AttributeState`, integer `refId` primary keys, and new schema tables), executing `prisma db push` or `prisma db push --accept-data-loss` / `--force-reset` on non-empty PostgreSQL databases causes Prisma to execute a `DROP TABLE ... CASCADE` followed by `CREATE TABLE ...` when non-null column additions or type changes conflict with existing schema rows.

### Mandatory Rules for AI Agents & Developers

To prevent database data loss in future developments:

1. **BACKUP FIRST**: Always run `npm run db:backup` BEFORE running any database schema changes, migrations, or destructive commands.
2. **NO FORCE RESETS**: NEVER run `prisma db push --accept-data-loss` or `prisma db push --force-reset` against a production or shared database.
3. **SAFE MIGRATIONS**: Use `prisma migrate dev --create-only` or custom SQL migration scripts with explicit fallback/default values for new non-null columns.

---

## Data Restoration Log (July 2026)

Following an accidental database reset, the production catalog was 100% recovered and verified against `sitemap.xml`:

- **101 Published Tools** (100% matching sitemap, including `skysenders`, `mails-ai`, `straight-mail`, `kendo`, and `cufinder`)
- **21 Canonical Comparison Pages** (`instantly-vs-manyreach`, `salesintel-vs-zoominfo`, `apollo-vs-zoominfo`, `outreach-vs-salesloft`, etc.)
- **14 Alternatives** (+572 relational links)
- **9 Categories** (+212 relational links)
- **Integrations** & Admin User configuration (`sainimrityunjay@gmail.com`)


---

## Deployment

### Railway (Recommended)

The project is deployed on [Railway](https://railway.app/):

1. Connect your GitHub repository to Railway
2. Configure all environment variables in the Railway dashboard
3. Set the build command: `bun run build`
4. Set the start command: `bun run start`
5. Railway auto-deploys on push to `main`

**Important production environment variables:**
- `SKIP_ENV_VALIDATION=true` — Required during build phase since server env vars are runtime-only
- `ANTHROPIC_API_KEY` — Required for AI content generation (Claude)
- `JINA_API_KEY` — Required for web search and scraping during content generation
- `DATABASE_URL` — Use the **pooled** connection string from Supabase for production

### Manual Deployment

1. **Build the project**

   ```bash
   bun run build
   ```

2. **Start the production server**

   ```bash
   bun run start
   ```

Ensure all environment variables are properly set in your production environment.

---

## API Keys (Hermes Agent)

ColdEmailKit includes a built-in API key system for programmatic access. This is primarily used by **Hermes Agent** (the AI agent) to automate dashboard operations.

### Creating a Key via Admin UI

1. Navigate to **Admin → API Keys** in the sidebar
2. Click **"New API Key"**
3. Set the name (e.g., `Hermes Agent`) and select the required scopes
4. Click **Create Key** — copy the raw key immediately (it won't be shown again)

### Creating a Key via curl

```bash
curl -X POST https://coldemailkit.com/api/admin/api-keys \
  -H "Cookie: <your-admin-session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hermes Agent",
    "scopes": ["tools:read", "tools:write", "submissions:manage", "analytics:read", "cron:manage", "settings:read"]
  }'
```

### Using the Key

Include the key in the `Authorization` header:

```bash
curl https://coldemailkit.com/api/some-endpoint \
  -H "Authorization: Bearer cek_your_key_here"
```

### Available Scopes

| Scope | Description |
|-------|-------------|
| `tools:read` | Read tool data |
| `tools:write` | Create/update tools |
| `submissions:manage` | Manage tool submissions |
| `analytics:read` | Read analytics data |
| `cron:manage` | Trigger cron jobs |
| `settings:read` | Read site settings |

### Revoking a Key

Revoke via the admin UI (click **Revoke** on any active key) or via API:

```bash
curl -X DELETE https://coldemailkit.com/api/admin/api-keys/<key-id> \
  -H "Cookie: <your-admin-session-cookie>"
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and passes all linting checks.

---

## Support

If you find this project helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📖 Improving documentation

---

## License

ColdEmailKit is licensed under the [GNU General Public License v3.0](LICENSE).

This means you are free to:
- ✅ Use the software for any purpose
- ✅ Modify the source code
- ✅ Distribute copies
- ✅ Distribute modified versions

Under the following conditions:
- 📄 Include the original copyright and license
- 📝 State changes made to the code
- 🔓 Make source code available when distributing
- 📜 License derivatives under GPL-3.0
