# Firebase Deployment Guide

## 🎉 Your App is Live!

**Live URL:** https://memodirector.web.app

## Initial Setup (Already Done)

The following steps have been completed:

1. ✅ Installed Firebase CLI globally
2. ✅ Logged into Firebase
3. ✅ Initialized Firebase Hosting
4. ✅ Configured `firebase.json` to use `dist` directory
5. ✅ Set up GitHub Actions for automatic deployment
6. ✅ Deployed to Firebase Hosting

## Project Configuration

### firebase.json
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### .firebaserc
Contains your Firebase project ID: `memodirector`

## Manual Deployment

To deploy manually from your local machine:

```bash
# 1. Build the app
npm run build

# 2. Deploy to Firebase
firebase deploy --only hosting
```

## Automatic Deployment via GitHub

Two GitHub Actions workflows have been set up:

### 1. On Pull Request
**File:** `.github/workflows/firebase-hosting-pull-request.yml`
- Triggers when a PR is created
- Deploys to a preview channel
- Adds a comment with the preview URL

### 2. On Merge to Main
**File:** `.github/workflows/firebase-hosting-merge.yml`
- Triggers when code is merged to `main` branch
- Automatically builds and deploys to production
- Updates https://memodirector.web.app

## Environment Variables

⚠️ **Important:** Environment variables in `.env` are NOT automatically available in production!

### For Local Development
Your `.env` file works fine locally.

### For Production (Firebase Hosting)
Environment variables are baked into the build at compile time. To update them:

1. Update your `.env` file
2. Rebuild: `npm run build`
3. Redeploy: `firebase deploy --only hosting`

### For GitHub Actions
If you need to use different API keys in production:

1. Go to your GitHub repository settings
2. Navigate to **Settings → Secrets and variables → Actions**
3. Add secrets like:
   - `VITE_GEMINI_API_KEY`
   - `VITE_FIREBASE_API_KEY`
   - etc.

4. Update `.github/workflows/firebase-hosting-merge.yml`:
```yaml
- run: npm ci && npm run build
  env:
    VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    # Add other secrets as needed
```

## Useful Commands

```bash
# View deployment history
firebase hosting:channel:list

# Deploy to a preview channel
firebase hosting:channel:deploy preview-name

# View logs
firebase hosting:channel:open

# Rollback to previous version (via Firebase Console)
# Go to: https://console.firebase.google.com/project/memodirector/hosting
```

## Custom Domain (Optional)

To add a custom domain:

1. Go to [Firebase Console](https://console.firebase.google.com/project/memodirector/hosting)
2. Click **Add custom domain**
3. Follow the instructions to verify ownership
4. Update DNS records as instructed

## Monitoring

- **Firebase Console:** https://console.firebase.google.com/project/memodirector/overview
- **Hosting Dashboard:** https://console.firebase.google.com/project/memodirector/hosting
- **Analytics:** Enable Google Analytics in Firebase Console for usage stats

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Fails
```bash
# Re-login to Firebase
firebase logout
firebase login
firebase deploy --only hosting
```

### Environment Variables Not Working
- Remember: Vite requires `VITE_` prefix
- Variables are baked in at build time
- Rebuild after changing `.env`

## Security Notes

- ✅ `.env` is in `.gitignore` (never commit API keys!)
- ✅ Firebase security rules should be configured for Firestore
- ✅ API keys in client-side code are normal (they're restricted by Firebase)
- ⚠️ Consider setting up Firebase App Check for additional security

## Next Steps

1. **Set up Firebase Security Rules** for Firestore
2. **Enable Firebase Analytics** for usage tracking
3. **Configure Firebase Performance Monitoring**
4. **Set up error tracking** (e.g., Sentry)
5. **Add a custom domain** if desired

---

**Need help?** Check the [Firebase Hosting docs](https://firebase.google.com/docs/hosting)
