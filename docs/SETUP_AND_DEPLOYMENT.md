# Setup & Deployment Guide

This guide covers the necessary steps to configure, develop, and deploy MemoDirector.

## 🛠️ Environment Configuration

MemoDirector uses Vite, which means environment variables are **baked into the build at compile time**.

### Local Setup

1.  Copy `.env.example` to `.env`.
2.  Fill in your keys:
    

```env
    VITE_GEMINI_API_KEY=your_key
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJh...
    ```

3.  Restart your dev server (`npm run dev`) after any changes to `.env`.

### Production (GitHub Secrets)

If using GitHub Actions for deployment, add these same keys to your repository:
*   **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

## ⚡ Supabase Setup

1.  **Project**: Create a new project at [supabase.com](https://supabase.com).
2.  **Database**: Run the schema provided in `SUPABASE_SETUP_GUIDE.md` (or the repository root) in the Supabase SQL Editor to create `user_pao_lists` and `pao_versions` tables.
3.  **RLS**: Ensure Row Level Security is enabled so users can only access their own data.
4.  **Auth**: Enable Email/Password or Google providers in the Supabase Auth dashboard.

## 🚀 Deployment

### Build the App

```bash
npm run build
```

This generates a `dist` folder containing your static assets.

### Hosting

MemoDirector can be hosted on any static hosting provider (Vercel, Netlify, Cloudflare Pages).
*   **Static Hosting**: Build and deploy the `dist` folder to your preferred provider.
*   **Vercel/Netlify**: Connect your GitHub repository for automatic deployments on push to `main`.

## 🛡️ Security Checklist

*   **Prefixes**: Ensure all client-side variables start with `VITE_`.
*   **Restrictions**: Restrict your Gemini and Supabase API keys to your specific production domains in their respective dashboards.
*   **Rules**: Never rely solely on client-side logic. Use Supabase RLS policies to protect your database.
*   **Git**: Never commit your `.env` file. It is included in `.gitignore` by default.

---
*Status: Production Ready*
*Last Updated: December 2025*
