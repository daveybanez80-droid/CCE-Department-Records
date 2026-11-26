-- School Department Management System - Initial Schema
-- Run this in Supabase SQL Editor or via `supabase db push`

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- STUDENTS TABLE
-- ============================================
create table if not exists public.students (
    id uuid primary key default gen_random_uuid(),
    student_id text unique not null,
    full_name text not null,
    email text,
    phone text,
    student_type text not null check (student_type in ('regular','irregular','transferee','graduating','graduated')),
    course text,
    year_level int check (year_level between 1 and 5),
    status text not null default 'active' check (status in ('active','inactive','graduated')),
    enrolled_at date,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_students_student_id on public.students(student_id);
create index if not exists idx_students_full_name on public.students(full_name);
create index if not exists idx_students_student_type on public.students(student_type);
create index if not exists idx_students_status on public.students(status);
create index if not exists idx_students_course on public.students(course);
create index if not exists idx_students_enrolled_at on public.students(enrolled_at);
create index if not exists idx_students_created_at on public.students(created_at desc);

-- ============================================
-- INVENTORY ITEMS TABLE
-- ============================================
create table if not exists public.inventory_items (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category text,
    quantity int not null default 0 check (quantity >= 0),
    unit text default 'pcs',
    location text,
    description text,
    min_threshold int not null default 5 check (min_threshold >= 0),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_inventory_name on public.inventory_items(name);
create index if not exists idx_inventory_category on public.inventory_items(category);
create index if not exists idx_inventory_quantity on public.inventory_items(quantity);
create index if not exists idx_inventory_location on public.inventory_items(location);

-- ============================================
-- INVENTORY ATTACHMENTS TABLE
-- ============================================
create table if not exists public.inventory_attachments (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references public.inventory_items(id) on delete cascade,
    file_path text not null,
    file_name text not null,
    file_type text,
    file_size int,
    uploaded_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now()
);

create index if not exists idx_inventory_attachments_item_id on public.inventory_attachments(item_id);

-- ============================================
-- IMPORT LOGS TABLE
-- ============================================
create table if not exists public.import_logs (
    id uuid primary key default gen_random_uuid(),
    filename text not null,
    total_rows int not null default 0,
    successful int not null default 0,
    failed int not null default 0,
    errors jsonb default '[]'::jsonb,
    imported_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now()
);

create index if not exists idx_import_logs_created_at on public.import_logs(created_at desc);
create index if not exists idx_import_logs_imported_by on public.import_logs(imported_by);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.students enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_attachments enable row level security;
alter table public.import_logs enable row level security;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Students policies
-- Admins can do everything
create policy "Admins full access students" on public.students
    for all using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Staff can read all, insert/update their own
create policy "Staff read students" on public.students
    for select using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' in ('admin', 'staff')
        )
    );

create policy "Staff insert students" on public.students
    for insert with check (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' in ('admin', 'staff')
        )
    );

create policy "Staff update students" on public.students
    for update using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' in ('admin', 'staff')
        )
    );

-- Viewers can only read
create policy "Viewers read students" on public.students
    for select using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' = 'viewer'
        )
    );

-- Inventory policies (same pattern)
create policy "Admins full access inventory" on public.inventory_items
    for all using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' = 'admin'
        )
    );

create policy "Staff read inventory" on public.inventory_items
    for select using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' in ('admin', 'staff')
        )
    );

create policy "Staff insert inventory" on public.inventory_items
    for insert with check (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' in ('admin', 'staff')
        )
    );

create policy "Staff update inventory" on public.inventory_items
    for update using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' in ('admin', 'staff')
        )
    );

create policy "Viewers read inventory" on public.inventory_items
    for select using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' = 'viewer'
        )
    );

-- Inventory attachments policies
create policy "Admins full access attachments" on public.inventory_attachments
    for all using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' = 'admin'
        )
    );

create policy "Staff manage attachments" on public.inventory_attachments
    for all using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' in ('admin', 'staff')
        )
    );

create policy "Viewers read attachments" on public.inventory_attachments
    for select using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' = 'viewer'
        )
    );

-- Import logs policies
create policy "Admins full access imports" on public.import_logs
    for all using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' = 'admin'
        )
    );

create policy "Staff read imports" on public.import_logs
    for select using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' in ('admin', 'staff')
        )
    );

create policy "Staff insert imports" on public.import_logs
    for insert with check (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' in ('admin', 'staff')
        )
    );

create policy "Viewers read imports" on public.import_logs
    for select using (
        exists (
            select 1 from auth.users
            where id = auth.uid()
            and raw_user_meta_data->>'role' = 'viewer'
        )
    );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger handle_updated_at_students
    before update on public.students
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_inventory
    before update on public.inventory_items
    for each row execute procedure public.handle_updated_at();

-- ============================================
-- STORAGE BUCKET FOR INVENTORY ATTACHMENTS
-- ============================================
-- Run this in Supabase Dashboard > Storage > Create bucket
-- Bucket name: inventory-attachments
-- Public: false (private)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

-- Storage policies (run after creating bucket)
-- create policy "Admins full access storage" on storage.objects
--     for all using (bucket_id = 'inventory-attachments' and auth.role() = 'authenticated' and (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin');
--
-- create policy "Staff upload storage" on storage.objects
--     for insert with check (bucket_id = 'inventory-attachments' and auth.role() = 'authenticated' and (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) in ('admin', 'staff'));
--
-- create policy "Staff read storage" on storage.objects
--     for select using (bucket_id = 'inventory-attachments' and auth.role() = 'authenticated' and (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) in ('admin', 'staff', 'viewer'));