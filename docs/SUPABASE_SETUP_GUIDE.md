# Supabase Setup Guide

This guide describes how to configure Supabase for MemoDirector, enabling multi-user support, cloud sync, and remote persistence.

> [! NOTE]
> We have migrated from Firebase to Supabase.

## 1. Create a Supabase Project

1.  Go to [Supabase Dashboard](https://supabase.com/dashboard).
2.  Click **New Project**.
3.  Choose your Organization.
4.  Enter a Name (e.g., `MemoDirector`).
5.  Set a Database Password (save this safely).
6.  Select a Region close to you.
7.  Click **Create new project**.

## 2. Environment Configuration

Once your project is ready (it may take a minute):

1.  Go to **Project Settings** (gear icon) -> **API**.
2.  Find **Project URL** and keys.
3.  Copy the **URL** and the **`anon` public** key.
4.  Update your `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

## 3. Database Schema

You need to create the tables for storing user lists and versions. Run the following SQL in the **SQL Editor** of your Supabase dashboard:

```sql
/** 
* User PAO Lists 
* Stores the main 00-99 list for each user
*/
create table user_pao_lists (
  user_id uuid primary key references auth.users(id),
  items jsonb, -- Stores the entire array of 100 items as JSON
  last_updated timestamptz
);

/**
* PAO Versions
* Stores historical or alternate versions of PAO lists
*/
create table pao_versions (
  id text primary key,
  user_id uuid references auth.users(id),
  name text,
  description text,
  created_at timestamptz,
  last_modified timestamptz,
  is_active boolean,
  items jsonb -- Stores the array of items for this version
);

-- Enable Row Level Security (RLS)
alter table user_pao_lists enable row level security;
alter table pao_versions enable row level security;

-- Create Policies
create policy "Users can all their own lists" 
on user_pao_lists for all 
using (auth.uid() = user_id);

create policy "Users can all their own versions" 
on pao_versions for all 
using (auth.uid() = user_id);
```

## 4. Storage Setup (Optional)

If you plan to implement media uploads (images/videos for PAO items):

1.  Go to **Storage** -> **New Bucket**.
2.  Name it `user-media`.
3.  Ensure "Public" is checked (or manage via signed URLs if you prefer stricter security).
4.  Add a policy to allow authenticated users to upload to their own folder:
    -   Target: `user-media`
    -   Operation: INSERT, SELECT, UPDATE, DELETE
    -   Policy Definition: `bucket_id = 'user-media' AND auth.uid() = (storage.foldername(name))[1]::uuid` (This assumes a folder structure of `{user_id}/{filename}`)

## 5. Authentication

Supabase Auth is enabled by default.

1.  Go to **Authentication** -> **Providers**.
2.  **Email/Password** is enabled by default.
3.  (Optional) Enable **Google**:
    -   You will need a Google Cloud Platform project credentials (Client ID / Secret).
    -   On Google Console, add `https://<YOUR_REF>.supabase.co/auth/v1/callback` as an Authorized Redirect URI.
