# BookShare - Community Book Sharing Platform

A web application for sharing books within offices, apartments, and communities.

## Features

- **Public Catalog**: Browse available books with search and category filters
- **Email-based Authentication**: OTP verification for secure login
- **Book Listing**: Add books with admin approval workflow
- **Borrow System**: Request books with waitlist queue support
- **Loan Tracking**: 21-day default loan duration with reminders
- **Email Notifications**: Automated notifications for requests, approvals, due dates
- **QR Codes**: Each book gets a unique QR code for easy identification
- **Admin Dashboard**: Manage approvals, users, and overdue books

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: Custom email OTP system
- **Email**: Abacus AI Notification API

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/venkatkrish78/bookshare.git
cd bookshare/nextjs_space
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

4. Run database migrations:
```bash
npx prisma migrate deploy
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
```

## Admin Setup

The first user with the email configured in `ADMIN_EMAIL` will automatically have admin privileges.

## Cron Jobs

Set up scheduled tasks for:
- `/api/cron/reminders` - Send due date reminders (daily)
- `/api/cron/expire-offers` - Expire unclaimed waitlist offers (hourly)

Requires `x-cron-secret` header matching `CRON_SECRET` env variable.

## License

MIT
