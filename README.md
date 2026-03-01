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
| **Latest Modification** | January 31, 2026 |

### Summary of Changes

The following major changes have been made from the original project:

- Rebranded as **ColdEmailKit** with focus on cold email tools and outreach software
- Updated content, metadata, and branding throughout the application
- Added proprietary rating algorithm for tool trust scores
- Enhanced admin panel with additional features for tool management
- Added integration management for cold email tool connections
- Implemented SEO schema markup for improved search visibility
- Updated payment integration from Stripe to Dodo Payments
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

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Runtime**: [Bun](https://bun.sh/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/)
- **Search**: [Meilisearch](https://www.meilisearch.com/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Email**: [Resend](https://resend.com/) with [React Email](https://react.email/)
- **Analytics**: [PostHog](https://posthog.com/)

---

## Services

ColdEmailKit uses the following third-party services:

| Service | Purpose | Website |
|---------|---------|---------|
| **Neon** | PostgreSQL Database | [neon.tech](https://neon.tech) |
| **Meilisearch** | Full-text Search | [meilisearch.com](https://www.meilisearch.com/) |
| **Upstash** | Redis Cache & Rate Limiting | [upstash.com](https://upstash.com/) |
| **PostHog** | Web & Product Analytics | [posthog.com](https://posthog.com/) |
| **Beehiiv** | Newsletter | [beehiiv.com](https://www.beehiiv.com/?via=mshiv) |
| **Resend** | Transactional Email | [resend.com](https://resend.com/) |
| **Inngest** | Background Jobs | [inngest.com](https://inngest.com/) |
| **Cloudflare R2** | File Storage | [cloudflare.com/r2](https://developers.cloudflare.com/r2/) |
| **Dodo Payments** | Payment Processing | [dodopayments.com](https://dodopayments.com/) |
| **ScreenshotOne** | Website Screenshots | [screenshotone.com](https://screenshotone.com/?via=mshiv) |
| **Firecrawl** | Web Scraping | [firecrawl.dev](https://firecrawl.link/mshiv) |

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
- [PostgreSQL](https://www.postgresql.org/) database (recommended: [Neon](https://neon.tech))
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
| **Search** | `MEILISEARCH_HOST`, `MEILISEARCH_ADMIN_KEY` | ✅ |
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
| `bun run email` | Start React Email development server |

---

## Deployment

### Vercel (Recommended)

The project is optimized for deployment on [Vercel](https://vercel.com/):

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

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
