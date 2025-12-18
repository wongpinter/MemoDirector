# Environment Variables Guide

## How Environment Variables Work with Vite + Firebase Hosting

### Important Concept:

Firebase Hosting serves **static files only**. Environment variables are **baked into your JavaScript at build time**, not injected at runtime.

```
.env file → Vite build → JavaScript with values → Firebase Hosting
```

## Setup for Different Environments

### 1. Local Development

**File:** `.env`

```bash
VITE_GEMINI_API_KEY=your_dev_key_here
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Usage:**

```bash
npm run dev  # Uses .env
```

### 2. Production (Local Deploy)

**File:** `.env.production`

```bash
VITE_GEMINI_API_KEY=your_production_key_here
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Usage:**

```bash
npm run build  # Uses .env.production
firebase deploy --only hosting
```

### 3. Production (GitHub Actions)

**Setup GitHub Secrets:**

1. Go to: https://github.com/wongpinter/MemoDirector/settings/secrets/actions

2. Click **"New repository secret"**

3. Add each secret:
   - Name: `VITE_GEMINI_API_KEY`

   - Value: `your_actual_key_here`

4. Repeat for Supabase:
   - `VITE_SUPABASE_URL`

   - `VITE_SUPABASE_ANON_KEY`

**The workflow files are already configured** to use these secrets!

## File Priority

Vite loads environment variables in this order (later files override earlier):

1. `.env` - Loaded in all cases
2. `.env.local` - Loaded in all cases, ignored by git
3. `.env.[mode]` - Only loaded in specified mode (e.g.,  `.env.production`)
4. `.env.[mode].local` - Only loaded in specified mode, ignored by git

## Current Setup

### What's Committed to Git:

* ✅ `.env.example` - Template with placeholders
* ✅ `.github/workflows/*.yml` - Configured to use GitHub Secrets

### What's Ignored by Git:

* ❌ `.env` - Your local development keys
* ❌ `.env.production` - Your production keys
* ❌ `.env.local` - Any local overrides
* ❌ `.env.*.local` - Any mode-specific local overrides

## Deployment Scenarios

### Scenario 1: Deploy from Local Machine

```bash
# Option A: Use .env.production
npm run build  # Automatically uses .env.production
firebase deploy --only hosting

# Option B: Use .env (development keys)
npm run build -- --mode development
firebase deploy --only hosting
```

### Scenario 2: Deploy via GitHub Actions

1. Push to `main` branch
2. GitHub Actions runs
3. Uses secrets from GitHub repository settings
4. Builds and deploys automatically

### Scenario 3: Preview Deploy (PR)

1. Create a pull request
2. GitHub Actions runs
3. Creates a preview deployment
4. Adds comment with preview URL

## Verifying Environment Variables

### Check what's in your build:

```bash
# Build the app
npm run build

# Search for your API key in the built files (be careful!)
# This shows that variables ARE in the JavaScript
grep -r "your-api-key-prefix" dist/
```

### Check in browser:

```javascript
// Open browser console on your deployed site
// Check the network tab - you'll see API calls with your keys
// This is normal for client-side apps!
```

## Security Considerations

⚠️ **Environment variables in Vite are PUBLIC** - they're in the client-side JavaScript!

### What This Means:

1. **Anyone can extract your API keys** from the deployed JavaScript
2. **This is normal** for client-side applications
3. **Protect your keys** using:
   - API key restrictions (domain/IP allowlists)
   - Firebase Security Rules
   - Rate limiting
   - Firebase App Check

### Best Practices:

1. **Restrict API Keys by Domain:**
   - Go to Google Cloud Console
   - Add HTTP referrer restrictions
   - Only allow your domain(s)

2. **Use Firebase Security Rules:**
   - Don't rely on API keys alone
   - Implement proper authentication
   - Use Firestore security rules

3. **Monitor Usage:**
   - Set up billing alerts
   - Monitor API usage regularly
   - Watch for unusual patterns

4. **Consider a Backend:**
   - For sensitive operations, use a backend API
   - Keep sensitive keys server-side
   - Proxy requests through your backend

## Troubleshooting

### Variables Not Working in Production?

**Check:**
1. Did you rebuild? `npm run build`
2. Are variables prefixed with `VITE_`?
3. Are they in `.env.production` or GitHub Secrets?
4. Did you redeploy after changing them?

### Different Values in Dev vs Production?

**Solution:**
* Use `.env` for development
* Use `.env.production` for production
* Or use GitHub Secrets for CI/CD

### Need to Update Production Variables?

**If deploying locally:**

```bash
# 1. Update .env.production
# 2. Rebuild
npm run build
# 3. Redeploy
firebase deploy --only hosting
```

**If using GitHub Actions:**

```bash
# 1. Update GitHub Secrets
# 2. Push to main (or re-run workflow)
git push origin main
```

## Example: Adding a New Variable

### 1. Add to TypeScript definitions:

**File:** `vite-env.d.ts`

```typescript
interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_NEW_VARIABLE: string; // Add this
  // ... other variables
}
```

### 2. Add to .env files:

**File:** `.env`

```bash
VITE_NEW_VARIABLE=dev_value
```

**File:** `.env.production`

```bash
VITE_NEW_VARIABLE=prod_value
```

### 3. Add to GitHub Secrets:

* Go to repository settings
* Add `VITE_NEW_VARIABLE` secret

### 4. Use in code:

```typescript
const myVar = import.meta.env.VITE_NEW_VARIABLE;
```

### 5. Rebuild and deploy:

```bash
npm run build
firebase deploy --only hosting
```

## Quick Reference

| Environment | File Used | Command |
|-------------|-----------|---------|
| Development | `.env` | `npm run dev` |
| Production (local) | `.env.production` | `npm run build` |
| Production (GitHub) | GitHub Secrets | `git push origin main` |

## Resources

* [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
* [Firebase Hosting](https://firebase.google.com/docs/hosting)
* [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Remember:** With static hosting, environment variables are baked in at build time!
