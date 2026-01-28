# Sacred Foundation Grants Dashboard

A comprehensive grants tracking and management dashboard for Sacred Foundation.

## Features

- **34+ Grants Tracked** - All eligible Australian grants with full details
- **Progress Tracking** - Track application status from research to outcome
- **Team Collaboration** - Invite team members and work together
- **Deadline Alerts** - Automatic notifications for upcoming deadlines
- **Cloud Sync** - Access from any device with real-time sync
- **Export** - PDF reports, CSV data, and calendar files
- **Authentication** - Secure login with email or Google

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to **Settings > API** and copy your:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/Public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service Role key (`SUPABASE_SERVICE_ROLE_KEY`)

### 2. Set Up Database

1. In Supabase, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Paste and run the entire SQL to create all tables and policies

### 3. Configure Authentication

1. In Supabase, go to **Authentication > Providers**
2. Enable **Email** provider (enabled by default)
3. (Optional) Enable **Google** provider:
   - Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
   - Add your site URL and callback URL
   - Enter Client ID and Secret in Supabase

### 4. Deploy to Vercel

#### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/sacred-grants-dashboard)

#### Option B: Manual Deploy

1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=generate-a-random-string
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

4. Deploy!

### 5. Configure Cron Jobs

Vercel will automatically set up cron jobs based on `vercel.json`:
- **Daily at 8 AM**: Check for upcoming deadlines and send notifications
- **Weekly on Sunday**: Check for grant updates

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for cron jobs) |
| `CRON_SECRET` | Secret for securing cron endpoints |
| `NEXT_PUBLIC_SITE_URL` | Your deployment URL |

## Project Structure

```
├── app/
│   ├── api/cron/          # Cron job API routes
│   ├── auth/              # Auth callback
│   ├── dashboard/         # Main dashboard pages
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   └── page.js            # Landing page
├── components/            # React components
├── lib/
│   ├── grants-data.js     # All grants data
│   └── supabase/          # Supabase clients
├── supabase/
│   └── schema.sql         # Database schema
└── vercel.json            # Cron configuration
```

## Grant Data

All grant data is stored in `lib/grants-data.js`. To add or update grants:

1. Edit the grants array in `lib/grants-data.js`
2. Deploy the update

## License

Private - Sacred Foundation
