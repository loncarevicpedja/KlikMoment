# KlikMoment

Premium wedding & event photo sharing SaaS with QR guest uploads, Cloudflare R2 storage, and role-based dashboards.

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, Shadcn-style UI, Framer Motion
- **Backend:** Next.js API Routes, Prisma, Zod validation
- **Database:** PostgreSQL
- **Auth:** Auth.js (NextAuth v5)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Editor:** TipTap (sanitized HTML output)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` – PostgreSQL connection string
- `AUTH_SECRET` – `openssl rand -base64 32`
- `AUTH_URL` – `http://localhost:3000`
- R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`)
- SMTP settings for owner activation emails
- `CRON_SECRET` for scheduled expiration jobs

### 3. Database setup

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Default admin (from seed): `admin@klikmoment.com` / `Admin123`

### 4. Run development server

```bash
npm run dev
```

## User Roles

| Role | Access |
|------|--------|
| **Admin** | `/admin` – all events, users, storage, QR codes |
| **Owner** | `/owner` – assigned events, gallery management |
| **Guest** | `/e/{slug}` – upload & optional gallery (no login) |

## Public Event URL

```
https://your-domain.com/e/{secure-slug}
```

Slugs are randomly generated (12 chars) and not sequential.

## Vercel Deployment

1. Connect repo to Vercel
2. Add all environment variables
3. Cron job runs daily at 06:00 UTC (`/api/cron/expire`) – set `CRON_SECRET` and configure Authorization header in Vercel Cron settings

## Project Structure

```
src/
├── app/              # Pages & API routes
├── components/       # UI, gallery, editor, upload
├── lib/
│   ├── auth/         # Permissions
│   ├── repositories/ # Prisma data access
│   ├── services/     # Business logic
│   └── validations/  # Zod schemas
prisma/
└── schema.prisma
```

## Security

- UUID event IDs
- Sanitized rich text (sanitize-html)
- Rate-limited guest uploads
- Permission checks on every protected route
- JWT sessions via Auth.js

## License

Private – All rights reserved.
