# School Department Management System

A modern, full-stack web application for managing student records and department inventory. Built with Next.js 15, Supabase, and deployed on Vercel.

## Features

### Student Records Management
- **Student Types**: Regular, Irregular, Transferee, Graduating, Graduated
- **Bulk Excel Import**: Drag-and-drop with validation, error reporting, and import history
- **Search & Filter**: By name, ID, email, student type, status
- **CRUD Operations**: Create, read, update, delete with audit trails

### Inventory Management
- **Item Tracking**: Name, category, quantity, location, description
- **Low Stock Alerts**: Configurable minimum thresholds with visual indicators
- **File Attachments**: Upload PDFs, images, documents per item (via Supabase Storage)
- **Stock Status**: In Stock, Low Stock, Out of Stock badges

### Authentication & Authorization
- **Supabase Auth**: Email/password + Magic Links
- **Role-Based Access**:
  - **Admin**: Full access to everything
  - **Staff**: Read/write students & inventory, manage imports
  - **Viewer**: Read-only access
- **Protected Routes**: Middleware-based auth protection
- **Session Management**: Auto-refresh, secure cookies

### Data & Backup
- **Export All Data**: JSON backup of students, inventory, and import logs
- **Import Backup**: Restore data from exported JSON files
- **Import History**: Track all bulk imports with success/failure counts

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS + shadcn/ui components |
| Deployment | Vercel (connected to GitHub) |
| File Parsing | SheetJS (xlsx) for Excel/CSV |
| Validation | Zod |

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- GitHub account
- Supabase account
- Vercel account

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd school-dept-mgmt
pnpm install
```

### 2. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration SQL in Supabase SQL Editor
3. Create storage bucket: `inventory-attachments` (private, 10MB)

### 4. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 5. Run Locally
```bash
pnpm dev
# Open http://localhost:3000
```

### 6. Deploy to Vercel
1. Push to GitHub
2. Import project in Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (login, register, callback)
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── dashboard/    # Overview with stats & charts
│   │   ├── students/     # Student list, new, edit, view
│   │   ├── inventory/    # Inventory list, new, edit, view
│   │   └── upload/       # Bulk Excel/CSV import
│   └── settings/         # User profile, notifications, security, data
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── students/         # Student-specific components
│   └── inventory/        # Inventory-specific components
├── lib/
│   ├── supabase/         # Supabase clients (client & server)
│   └── utils/            # Helpers (cn, formatting, types)
└── public/
    └── assets/           # Logos, icons, and images
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role (server-only) |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (localhost or production) |

## Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:push      # Push migrations to Supabase
pnpm db:studio    # Open Supabase Studio locally
pnpm db:generate  # Generate TypeScript types from DB
```

## License

MIT License - feel free to use for your department!